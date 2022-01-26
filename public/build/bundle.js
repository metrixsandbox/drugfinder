
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.2' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/App.svelte generated by Svelte v3.46.2 */

    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let p0;
    	let t3;
    	let form0;
    	let input0;
    	let t4;
    	let button0;
    	let t6;
    	let div0;
    	let p1;
    	let t7;
    	let t8;
    	let t9;
    	let p2;
    	let t10;
    	let t11;
    	let t12;
    	let h3;
    	let t14;
    	let form1;
    	let input1;
    	let t15;
    	let button1;
    	let t17;
    	let div1;
    	let p3;
    	let t18;
    	let t19;
    	let t20;
    	let t21;
    	let t22;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Hello!";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "Find the brand drug names from generics";
    			t3 = space();
    			form0 = element("form");
    			input0 = element("input");
    			t4 = space();
    			button0 = element("button");
    			button0.textContent = "Click me";
    			t6 = space();
    			div0 = element("div");
    			p1 = element("p");
    			t7 = text("Generic: ");
    			t8 = text(/*generic*/ ctx[0]);
    			t9 = space();
    			p2 = element("p");
    			t10 = text("Brand: ");
    			t11 = text(/*synonym*/ ctx[1]);
    			t12 = space();
    			h3 = element("h3");
    			h3.textContent = "Did you misspell something? Try below.";
    			t14 = space();
    			form1 = element("form");
    			input1 = element("input");
    			t15 = space();
    			button1 = element("button");
    			button1.textContent = "Click me";
    			t17 = space();
    			div1 = element("div");
    			p3 = element("p");
    			t18 = text("Did you mean ");
    			t19 = text(/*suggest1*/ ctx[4]);
    			t20 = text(" or ");
    			t21 = text(/*suggest2*/ ctx[5]);
    			t22 = text("?");
    			attr_dev(h1, "class", "svelte-117fhev");
    			add_location(h1, file, 35, 1, 925);
    			add_location(p0, file, 36, 1, 942);
    			attr_dev(input0, "placeholder", "enter generic name..");
    			add_location(input0, file, 39, 2, 1040);
    			add_location(button0, file, 41, 2, 1106);
    			add_location(form0, file, 37, 1, 990);
    			add_location(p1, file, 47, 1, 1198);
    			add_location(p2, file, 48, 1, 1225);
    			attr_dev(div0, "id", "dataReturn");
    			set_style(div0, "display", "none");
    			add_location(div0, file, 46, 0, 1153);
    			attr_dev(h3, "class", "svelte-117fhev");
    			add_location(h3, file, 50, 1, 1258);
    			attr_dev(input1, "placeholder", "enter your best guess here..");
    			add_location(input1, file, 54, 2, 1360);
    			add_location(button1, file, 56, 2, 1435);
    			add_location(form1, file, 52, 1, 1308);
    			add_location(p3, file, 62, 1, 1529);
    			attr_dev(div1, "id", "dataReturn2");
    			set_style(div1, "display", "none");
    			add_location(div1, file, 61, 0, 1482);
    			attr_dev(main, "class", "svelte-117fhev");
    			add_location(main, file, 34, 0, 917);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, p0);
    			append_dev(main, t3);
    			append_dev(main, form0);
    			append_dev(form0, input0);
    			set_input_value(input0, /*name*/ ctx[2]);
    			append_dev(form0, t4);
    			append_dev(form0, button0);
    			append_dev(main, t6);
    			append_dev(main, div0);
    			append_dev(div0, p1);
    			append_dev(p1, t7);
    			append_dev(p1, t8);
    			append_dev(div0, t9);
    			append_dev(div0, p2);
    			append_dev(p2, t10);
    			append_dev(p2, t11);
    			append_dev(main, t12);
    			append_dev(main, h3);
    			append_dev(main, t14);
    			append_dev(main, form1);
    			append_dev(form1, input1);
    			set_input_value(input1, /*name2*/ ctx[3]);
    			append_dev(form1, t15);
    			append_dev(form1, button1);
    			append_dev(main, t17);
    			append_dev(main, div1);
    			append_dev(div1, p3);
    			append_dev(p3, t18);
    			append_dev(p3, t19);
    			append_dev(p3, t20);
    			append_dev(p3, t21);
    			append_dev(p3, t22);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[8]),
    					listen_dev(form0, "submit", prevent_default(/*nameFinder*/ ctx[6]), false, true, false),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[9]),
    					listen_dev(form1, "submit", prevent_default(/*nameNotFound*/ ctx[7]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*name*/ 4 && input0.value !== /*name*/ ctx[2]) {
    				set_input_value(input0, /*name*/ ctx[2]);
    			}

    			if (dirty & /*generic*/ 1) set_data_dev(t8, /*generic*/ ctx[0]);
    			if (dirty & /*synonym*/ 2) set_data_dev(t11, /*synonym*/ ctx[1]);

    			if (dirty & /*name2*/ 8 && input1.value !== /*name2*/ ctx[3]) {
    				set_input_value(input1, /*name2*/ ctx[3]);
    			}

    			if (dirty & /*suggest1*/ 16) set_data_dev(t19, /*suggest1*/ ctx[4]);
    			if (dirty & /*suggest2*/ 32) set_data_dev(t21, /*suggest2*/ ctx[5]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let generic;
    	let synonym;
    	let name;
    	let name2;
    	let suggest1;
    	let suggest2;

    	const nameFinder = () => {
    		fetch('https://rxnav.nlm.nih.gov/REST/drugs.json?name=' + name).then(response => response.json()).then(drug => {
    			$$invalidate(0, generic = drug.drugGroup.conceptGroup[2].conceptProperties[0].name);
    			$$invalidate(1, synonym = drug.drugGroup.conceptGroup[2].conceptProperties[0].synonym);
    			var T = document.getElementById("dataReturn");
    			T.style.display = "block";
    		});
    	};

    	const nameNotFound = () => {
    		fetch('https://rxnav.nlm.nih.gov/REST/spellingsuggestions.json?name=' + name2).then(response => response.json()).then(suggest => {
    			$$invalidate(4, suggest1 = suggest.suggestionGroup.suggestionList.suggestion[0]);
    			$$invalidate(5, suggest2 = suggest.suggestionGroup.suggestionList.suggestion[1]);
    			var T = document.getElementById("dataReturn2");
    			T.style.display = "block";
    		});
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		name = this.value;
    		$$invalidate(2, name);
    	}

    	function input1_input_handler() {
    		name2 = this.value;
    		$$invalidate(3, name2);
    	}

    	$$self.$capture_state = () => ({
    		generic,
    		synonym,
    		name,
    		name2,
    		suggest1,
    		suggest2,
    		nameFinder,
    		nameNotFound
    	});

    	$$self.$inject_state = $$props => {
    		if ('generic' in $$props) $$invalidate(0, generic = $$props.generic);
    		if ('synonym' in $$props) $$invalidate(1, synonym = $$props.synonym);
    		if ('name' in $$props) $$invalidate(2, name = $$props.name);
    		if ('name2' in $$props) $$invalidate(3, name2 = $$props.name2);
    		if ('suggest1' in $$props) $$invalidate(4, suggest1 = $$props.suggest1);
    		if ('suggest2' in $$props) $$invalidate(5, suggest2 = $$props.suggest2);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		generic,
    		synonym,
    		name,
    		name2,
    		suggest1,
    		suggest2,
    		nameFinder,
    		nameNotFound,
    		input0_input_handler,
    		input1_input_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
