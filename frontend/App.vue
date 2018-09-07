<template>
  <div id="app">
    <div id="nav">
      <router-link to="/">Home</router-link> |
      <router-link to="/login">Login</router-link> |
      <router-link to="/signup">Sign Up</router-link> |
      <router-link to="/protected">Protected</router-link> |
      <router-link to="/about">About</router-link> |
    </div>
    <router-view/>
  </div>
</template>

<style lang="scss">
@import "./styles/common";
</style>

<style lang="scss" scoped>

@import "./styles/variables";

#nav {
  padding: 30px;
  a {
    font-weight: bold;
    color: #2c3e50;
    &.router-link-exact-active {
      color: #42b983;
    }
  }
}

</style>
