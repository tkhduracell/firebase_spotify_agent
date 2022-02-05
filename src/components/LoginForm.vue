<template>
    <b-modal id="signin" title="Sign In" @ok="doSignIn">
        <b-row class="my-1">
        <b-col cols="12" class="mb-3">
            As an admin you can help keeping the track database up-to date. If you are intrested in don't hesitate to contact me.
        </b-col>
        <b-col sm="2">
            <label for="input-email">Email:</label>
        </b-col>
        <b-col sm="10">
            <b-form-input v-model="form.user" id="input-email" size="sm" placeholder="Enter your email" />
        </b-col>
        </b-row>
        <b-row class="my-1">
        <b-col sm="2">
            <label for="input-password">Password:</label>
        </b-col>
        <b-col sm="10">
            <b-form-input v-model="form.pass" id="input-password" size="sm" placeholder="Enter your password" type="password" />
        </b-col>
        </b-row>
    </b-modal>
</template>

<script lang="ts">
import { defineComponent, reactive } from '@vue/composition-api'
import { signIn, useFirebaseUser } from '../firebase'

export default defineComponent({
  setup () {
    const form = reactive({ user: '', pass: '' })
    useFirebaseUser()

    return {
      form,
      doSignIn () {
        signIn(form.user, form.pass)
      }
    }
  }
})
</script>
