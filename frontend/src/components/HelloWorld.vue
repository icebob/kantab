<template lang="pug">
div
  h1 {{ msg }}
  button(@click="count++") count is: {{ count }}
  .w-40.h-40.bg-pink-500
</template>

<script>
export default {
  name: 'HelloWorld',
  props: {
    msg: String
  },
  data() {
    return {
      count: 0
    }
  }
}
</script>

<style lang="scss" scoped>
h1 {
  color: red;
}
</style>
