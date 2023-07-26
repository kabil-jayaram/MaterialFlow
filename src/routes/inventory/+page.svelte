<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com">
<link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,opsz,wght@1,6..12,600&display=swap" rel="stylesheet">
<form id="form-wrapper">
    <div class="flow">
        <div class="col-md-2">Material Id <input type="number" class="material_id" id="material_id"></div>
        <div class="col-md-2">Name <input type="text" class="name" id="name"></div>
        <div class="col-md-2">Count <input type="number" class="count" id="count"></div>
        <div class="col-md-1">Date <input type="date" class="date" id="date"></div>        
        <button type="button" class="btn btn-sm btn-primary justify-content-center" id="add" on:click={add}>Add</button>
        <button type="button" class="btn btn-sm btn-danger justify-content-center" id="remove"on:click={remove}>Remove</button>
    </div>
    <h4 style="margin-top: 40px;">{tableName}</h4>
    <table class="table table-bordered table-striped table-hover">
      <thead>
        <tr>
          <th>Material Id</th>
          <th>Name</th>
          <th>Count</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody id="recentEntries">
        {#each tableEntries as entry}
          <tr>
            <td><span class="math-inline">{entry.id}</span></td>
            <td><span>{entry.name}</span></td>
            <td>
              <span class="text">
                {#if entry.action === 'add'}
                  +{entry.count}
                {:else if entry.action === 'remove'}
                  -{entry.count}
                {:else}
                  {entry.count}
                {/if}
              </span>
            </td>
            <td><span>{entry.date}</span></td>
          </tr>
        {/each}
      </tbody>
    </table>
</form>

<div class="toast-container">
  {#if $notifications}
    <div class="notifications">
      {#each $notifications as notification}
        <div 
          role="alert"
          class="notification"
          style="bottom: 30px; max-width: fit-content;"
          transition:fade
        >
        {notification}  
        </div>
      {/each}
    </div>
  {/if}
</div>

<script>
  import { onMount, afterUpdate } from 'svelte';
  import { fade } from 'svelte/transition';
  import { notifications } from './notification';
  import { toast } from './notification';

  let form;
  let tableEntries = [];
  let tableName = "Materials in Inventory";
  let entriesRemoved = false;

  onMount(() => {
    form = document.querySelector('form');
    fetchRecentEntries();
  });

  afterUpdate(() => {
    // Slice the tableEntries to show only the first 5 rows
    tableEntries = tableEntries.slice(0, 5);
  });

  const fetchRecentEntries = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/getRecentEntries');
      const data = await response.json();
      tableEntries = data.entries;
      entriesRemoved = true;
    } catch (err) {
      console.error('Error fetching recent entries:', err);
    }
  };

  function add() {
    const id = form?.elements.material_id.value;
    const name = form?.elements.name.value;
    const count = form?.elements.count.value;
    const date = form?.elements.date.value;
  
    // Check if all fields are filled
    if (!id || !name || !count || !date) {
      toast('Please fill in all the fields!!!');
      return;
    }

    const isDuplicate = tableEntries.some(entry => entry.id === id && entry.name !== name);
    if (isDuplicate) {
      toast('A material with the same ID but different name already exists!!!');
      return;
    }

    fetch('http://localhost:5000/api/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, name, count, date }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message === 'Material updated successfully' || data.message === 'Material inserted successfully') {
          const newEntry = { id, name, count, date, action: 'add' };
          const tbody = document.querySelector('#recentEntries');
          if (entriesRemoved) {
            tableEntries = [];
            tableName = "Recent Entries";
            entriesRemoved=false;
          }
          tableEntries.unshift(newEntry);
          toast('Material Added Successfully!!!');
          // Clear the form fields after successfully adding an entry
          form?.reset();
        }
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  }

  let removeDateError = false;
  let materialNotFoundError = false;

  function remove() {
    const id = form?.elements.material_id.value;
    const name = form?.elements.name.value;
    const count = form?.elements.count.value;
    const date = form?.elements.date.value;
    

    // Check if all fields are filled
    if (!id || !name || !count || !date) {
      toast('Please fill in all the fields!!!');
      return;
    }

    const isMatchingMaterial = tableEntries.some(entry => entry.id == id && entry.name == name);
    if (!isMatchingMaterial) {
      toast('Material with the given ID and name not found!!!');
      return;
    }

    fetch('http://localhost:5000/api/remove', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, count, date }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message === 'Material updated successfully') {
          const newEntry = { id, name, count, date, action: 'remove' };
          const tbody = document.querySelector('#recentEntries');
          if (entriesRemoved) {
            tableEntries = [];
            tableName = "Recent Entries";
            entriesRemoved=false;
          }
          tableEntries.unshift(newEntry);
          toast('Inventory Updated Successfully!!!');
          // Clear the form fields after successfully adding an entry
          form?.reset();

          // Reset the error status variables
          materialNotFoundError = false;
          removeDateError = false;
        } else {
          // Display toast messages for error scenarios
          if (data.message === 'Existing count is less than the requested count') {
            toast('Existing Stock is less than the Requested Amount!!!');
          } else if (data.message === 'Existing count is zero') {
            toast("Removing Amount can't be zero!!!");
          } else if (data.message === 'Remove date is before add date') {
            toast('Removing date is before adding date!!!');
            // Set the error status variables
            materialNotFoundError = false;
            removeDateError = true;
          } else if (data.message === 'Material not found') {
            toast('Material with the given id not found!!!');
            // Set the error status variables
            materialNotFoundError = true;
            removeDateError = false;
          }
        }
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  }
</script>

<style>
  * {
    font-family: Nunito Sans;
  }

  #add, #remove {
    width: 90px;
  }

  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .flow,h4 {
    display: flex;
    justify-content: space-around;
    align-items: center;
  }  

  .toast-container {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    display: flex;
    justify-content: center;
    pointer-events: none;
  }

  .notifications {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    pointer-events: auto;
  }

  .notification {
    padding: 10px 20px;
    margin: 5px;
    border-radius: 4px;
    color: white;
    font-size: 14px;
    background-color: #333;
    opacity: 0.8;
    transition: opacity 0.3s ease-in-out;
    text-align: center;
  }
</style>
