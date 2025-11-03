<script lang="ts">
  import ChatWidget from './components/ChatWidget.svelte'
</script>

<main>
  <ChatWidget />
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    height: 100vh;
    width: 100vw;
  }

  :global(#app) {
    height: 100vh;
    width: 100vw;
  }

  main {
    height: 100%;
    width: 100%;
  }
</style>
