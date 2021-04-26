<script>
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let title;
  let exercise = {
    activity: "",
    sets: 4,
    reps: 10
  };

  let exercises = [];

  function handleSubmit() {
    exercises = [...exercises, { ...exercise }];
    dispatch("add-exercise", { ...exercise, title: title });
    // reset
    exercise = {
      activity: "",
      sets: 4,
      reps: 10
    };
  }

  function stringify(object) {
    return JSON.stringify(object);
  }
  function stringifyArray(array) {
    let res = [];
    for (let obj of array) {
      res = [...res, stringify(obj)];
    }
    return res;
  }
</script>

<style>

</style>

<div>
  <h2>{title}</h2>
  <div>
    <form on:submit|preventDefault={handleSubmit}>
      <div>
        <label for="activity">Activity</label>
        <input type="text" id="activity" bind:value={exercise.activity} />
      </div>
      <div>
        <label for="sets">Sets</label>
        <input type="number" id="sets" bind:value={exercise.sets} />
      </div>
      <div>
        <label for="reps">Reps</label>
        <input type="number" id="reps" bind:value={exercise.reps} />
      </div>
      <button type="submit">add exercise</button>
    </form>
  </div>
  <div>
    <ul>
      {#each exercises as ex}
        <li>{ex.activity}: {ex.sets} sets of {ex.reps} reps</li>
      {/each}
    </ul>
  </div>

</div>
