<template>
  <div id="app">
    <div id="nav">
      <router-link to="/">Home</router-link> |
      <router-link to="/protected">Protected</router-link> |
      <router-link to="/about">About</router-link> |
	  <template v-if="!$authenticator.isAuthenticated()">
		<router-link to="/login">Login</router-link> |
		<router-link to="/signup">Sign Up</router-link> |
	  </template>
	  <template v-else>
		<a href="#" @click="$authenticator.logout()">Logout</a> |
	  </template>
    </div>
    <router-view/>
  </div>
</template>

<script>
import store from "./store";

export default {
	created() {
		store.dispatch("init");
	}
};
</script>


<style lang="scss">
@import "./styles/common";
</style>

<style lang="scss" scoped>

@import "./styles/variables";

#nav {
  padding: 30px;
  a {
    font-weight: bold;
    color: #e4eaf1;
    &.router-link-exact-active {
      color: #42b983;
    }
  }
}

</style>
