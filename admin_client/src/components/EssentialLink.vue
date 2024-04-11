<template>
  <q-item clickable v-if="page" :to="page">

    <q-item-section v-if="icon" avatar>
      <q-icon :name="icon" />
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ title }}</q-item-label>
      <q-item-label caption>{{ caption }}</q-item-label>
    </q-item-section>
  </q-item>

  <q-item clickable v-else :href="link" target="_blank" tag="a">
    <q-item-section v-if="icon" avatar>
      <q-icon :name="icon" />
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ title }}</q-item-label>
      <q-item-label caption>{{ caption }}</q-item-label>
    </q-item-section>
  </q-item>

</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'EssentialLink',
  props: {
    title: {
      type: String,
      required: true
    },

    caption: {
      type: String,
      default: ''
    },

    link: {
      type: String,
      default: '#'
    },

    icon: {
      type: String,
      default: ''
    },
    page: {
      type: String,
      default: ''
    }
  }
})
</script>
<style lang="scss" scoped>
.text-caption {
  color: $grey-14;
}

.active-item {
  background-color: $grey-3;
  color: $indigo-7;
  font-weight: bold;
  .text-caption {
    color: $indigo-4;
  }
}

body.body--dark {
  .active-item {
    background-color: $blue-grey-10;
    color: $blue-grey-1;
    .text-caption {
      color: $blue-grey-3;
    }
  }

  .text-caption {
    color: $grey-7;
  }
  .q-item {
    background-color: $grey-10;
  }
}
</style>