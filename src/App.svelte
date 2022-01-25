<script>

    let generic;
	let synonym;
	let name;
	let name2;
	let suggest1;
	let suggest2;

	const nameFinder = () => {
		fetch('https://rxnav.nlm.nih.gov/REST/drugs.json?name=' + name)
			.then((response) => response.json())
			.then((drug) => {
				generic = drug.drugGroup.conceptGroup[2].conceptProperties[0].name;
				synonym = drug.drugGroup.conceptGroup[2].conceptProperties[0].synonym;
				var T = document.getElementById("dataReturn");
    			T.style.display = "block"; 
			}) 	
	}

	const nameNotFound = () => {
		fetch('https://rxnav.nlm.nih.gov/REST/spellingsuggestions.json?name=' + name2)
			.then((response) => response.json())
			.then((suggest) => {
				suggest1 = suggest.suggestionGroup.suggestionList.suggestion[0]
				suggest2 = suggest.suggestionGroup.suggestionList.suggestion[1]
				var T = document.getElementById("dataReturn2");
    			T.style.display = "block"; 
			}) 	
	}


</script>

<main>
	<h1>Hello!</h1>
	<p>Find the brand drug names from generics</p>
	<form on:submit|preventDefault={nameFinder}>
		
		<input bind:value={name} placeholder="enter generic name..">
		
		<button>
			Click me
		</button>	
			
	</form>
<div id="dataReturn" style="display:none">	
	<p>Generic: {generic}</p>
	<p>Brand: {synonym} </p>
</div>
	<h3>Did you misspell something? Try below.</h3>

	<form on:submit|preventDefault={nameNotFound}>
		
		<input bind:value={name2} placeholder="enter your best guess here..">
		
		<button>
			Click me
		</button>	
			
	</form>
<div id="dataReturn2" style="display:none">		
	<p>Did you mean {suggest1} or {suggest2}?</p>
</div>	
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	h3 {
		color: #ff3e00;
		font-size: 2em;
		font-weight: 50;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>