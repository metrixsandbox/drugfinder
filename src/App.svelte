<script>

    let generic;
	let synonym;
	let name;

	const nameFinder = () => {
		fetch('https://rxnav.nlm.nih.gov/REST/drugs.json?name=' + name)
			.then((response) => response.json())
			.then((drug) => {
				generic = drug.drugGroup.conceptGroup[2].conceptProperties[0].name;
				synonym = drug.drugGroup.conceptGroup[2].conceptProperties[0].synonym;
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

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>