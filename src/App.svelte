<script>
  import TrainingDay from "./components/TrainingDay.svelte";
  export let name;
</script>

<style>
  h1 {
    color: purple;
  }
</style>

<h1>{name}</h1>
<TrainingDay/>
