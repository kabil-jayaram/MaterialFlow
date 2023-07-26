<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">
<div style="margin: 0;">
    <header class="d-flex justify-content-center py-2 ">
        <ul class="nav nav-pills">
          <li class="nav-item m-3"><a href="/" class="nav-link" aria-current="page">Home</a></li>
          <li class="nav-item m-3"><a href="/inventory" class="nav-link">Inventory</a></li>
        </ul>
      </header>

</div>
<slot />

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com">
<link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,opsz,wght@1,6..12,600&display=swap" rel="stylesheet">
<style>
    * {
        font-family: Nunito Sans;
    }

    ul li:hover{
        background-color: blue;
        border-radius: 5px;
    }
    a:hover{
        color: white;
    }
</style>