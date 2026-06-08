<template>
  <div v-if="Object.keys(formState.structure).length > 0" class="is-kontaktseite">
    <template v-for="(boneValue, boneName) in formState.skel" :key="boneName">
      <template v-if="formState.structure?.[boneName] && ['firstname', 'lastname'].includes(boneName)">
        <slot
          label="placeholder"
          :bone-name="boneName"
          :widget="getBoneWidget(formState.structure[boneName]['type'])"
        ></slot>
      </template>
    </template>

    <h2>Adresse</h2>
    <div class="row">
      <template v-if="formState.structure?.['street_name']">
        <slot
          bone-name="street_name"
          label="placeholder"
          :widget="getBoneWidget(formState.structure['street_name']['type'])"
        ></slot>
      </template>
      <template v-if="formState.structure?.['street_number']">
        <slot
          bone-name="street_number"
          label="placeholder"
          :widget="getBoneWidget(formState.structure['street_number']['type'])"
        ></slot>
      </template>
    </div>
    <div class="row">
      <template v-if="formState.structure?.['address_addition']">
        <slot
          bone-name="address_addition"
          label="placeholder"
          :widget="getBoneWidget(formState.structure['address_addition']['type'])"
        ></slot>
      </template>
    </div>
    <div class="row">
      <template v-if="formState.structure?.['zip_code']">
        <slot
          bone-name="zip_code"
          label="placeholder"
          :widget="getBoneWidget(formState.structure['zip_code']['type'])"
        ></slot>
      </template>
      <template v-if="formState.structure?.['city']">
        <slot bone-name="city" label="placeholder" :widget="getBoneWidget(formState.structure['city']['type'])"></slot>
      </template>
    </div>

    <h2>Kontakt</h2>
    <template v-if="formState.structure?.['phone']">
      <slot bone-name="phone" label="placeholder" :widget="getBoneWidget(formState.structure['phone']['type'])"></slot>
    </template>
    <template v-if="formState.structure?.['email']">
      <slot bone-name="email" label="placeholder" :widget="getBoneWidget(formState.structure['email']['type'])"></slot>
    </template>
  </div>
</template>

<script setup>
import { inject } from "vue"
import { getBoneWidget } from "@viur/vue-utils/bones/edit"
const formState = inject("formState")
const formUpdate = inject("formUpdate")
</script>

<style scoped>
.row {
  display: flex;
  gap: 5px;
}
</style>
