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
			}) 	
	}

	const nameNotFound = () => {
		fetch('https://rxnav.nlm.nih.gov/REST/spellingsuggestions.json?name=' + name2)
			.then((response) => response.json())
			.then((suggest) => {
				suggest1 = suggest.suggestionGroup.suggestionList.suggestion[0]
				suggest2 = suggest.suggestionGroup.suggestionList.suggestion[1]
			}) 	
	}


</script>

<main>
	<h1>Hello!</h1>
	<p>Find the brand drug names from generics</p>
	<form on:submit|preventDefault={nameFinder}>
		
		<input bind:value={name}>
		
		<button>
			Click me
		</button>	
			
	</form>
	
	<p>Generic: {generic}</p>
	<p>Brand: {synonym} </p>

	<h3>Did you misspell something? Try below.</h3>

	<form on:submit|preventDefault={nameNotFound}>
		
		<input bind:value={name2}>
		
		<button>
			Click me
		</button>	
			
	</form>
	
	<p>Did you mean {suggest1} or {suggest2}?</p>
	
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