<template>
  <div v-if="Object.keys(formState.structure).length > 0" class="is-kontaktseite">
    <template v-for="(boneValue, boneName) in formState.skel" :key="boneName">
      <template v-if="formState.structure?.[boneName] && ['order_uid', 'payment_provider', 'total'].includes(boneName)">
        <slot :bone-name="boneName" :widget="getBoneWidget(formState.structure[boneName]['type'])"></slot>
      </template>
    </template>
    <template v-if="formState.structure?.['is_checkout_in_progress']">
      <slot
        bone-name="is_checkout_in_progress"
        :widget="getBoneWidget(formState.structure['is_checkout_in_progress']['type'])"
      ></slot>
    </template>
    <template v-if="formState.structure?.['is_ordered']">
      <slot bone-name="is_ordered" :widget="getBoneWidget(formState.structure['is_ordered']['type'])"></slot>
    </template>
    <template v-if="formState.structure?.['is_rts']">
      <slot bone-name="is_rts" :widget="getBoneWidget(formState.structure['is_rts']['type'])"></slot>
    </template>

    <template v-if="formState.structure?.['is_paid']">
      <slot bone-name="is_paid" :widget="getBoneWidget(formState.structure['is_paid']['type'])"></slot>
    </template>

    <template v-if="formState.structure?.['is_shipped']">
      <slot bone-name="is_shipped" :widget="getBoneWidget(formState.structure['is_shipped']['type'])"></slot>
    </template>
  </div>
</template>

<script setup>
import { inject } from "vue"
import { getBoneWidget } from "@viur/vue-utils/bones/edit"
const formState = inject("formState")
const formUpdate = inject("formUpdate")
</script>

<style scoped></style>
