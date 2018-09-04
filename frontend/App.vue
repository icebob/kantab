<template>
  <div id="app">
    <div id="nav">
      <router-link to="/">Home</router-link> |
      <router-link to="/login">Login</router-link> |
      <router-link to="/signup">Sign Up</router-link> |
      <router-link to="/about">About</router-link> |
    </div>
    <router-view/>
  </div>
</template>

<style lang="scss">

html, body {
	margin: 0;
	padding: 0;
	width: 100%;
	height: 100%;

	background-image: url("./assets/bg7.jpg");

	background-size: cover;
	background-position: center center;

	color: white;

	font-family: "Open Sans", Arial, sans-serif;
	font-size: 16px;
}

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
}
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

@import url(https://fonts.googleapis.com/css?family=Dosis:300|Lato:300,400,600,700|Roboto+Condensed:300,700|Open+Sans+Condensed:300,600|Open+Sans:400,300,600,700|Maven+Pro:400,700);

@import url('https://netdna.bootstrapcdn.com/font-awesome/4.0.3/css/font-awesome.css');
</style>
