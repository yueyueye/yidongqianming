<script setup lang="ts">
import SignName from "./components/SignName.vue";
import { reactive, ref } from "vue";

const globalData = reactive({
  value:
    "SignName",
});
const setGlobalData = (obj: any) => {
  globalData.value = obj.value;
};

// const url = ref("https://zion-app.functorz.com/zero/JmAxbl1kYqo/api/graphql-v2");
// const actionflow_id = ref("5e5e155d-7b3c-4771-bf94-ceb597cbb666");

</script>

<template>
  <SignName
    :global-data="globalData"
    :set-global-data="setGlobalData"
    :url="url"
    :actionflow_id="actionflow_id"
  />
</template>

<style>
#app {
  height: 100vh;
}
</style>
