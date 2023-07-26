<script>
  export let message;
</script>

<div class="toast">
  {message}
</div>

<style>
  .toast {
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