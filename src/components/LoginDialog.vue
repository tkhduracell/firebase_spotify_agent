<template>
    <b-modal id="signin" title="Sign In" @ok="signIn" hide-footer >
      <b-row class="my-1" align-content="center">
        <b-col cols="12" class="mb-3">
            As an admin you can help keeping the track database up-to date. If you are intrested in don't hesitate to contact me.
        </b-col>
        <b-col cols="auto" class="mx-auto" >
            <b-button  size="lg" variant="primary" @click="signIn">
              <b-icon-google scale="1.0" />
              Sign in with your Google Account
            </b-button>
        </b-col>
        </b-row>
    </b-modal>
</template>

<script lang="ts">
import { defineComponent, reactive } from '@vue/composition-api'
import { useFirebaseUser } from '../firebase'

export default defineComponent({
  setup (props, { root: { $bvModal } }) {
    const form = reactive({ user: '', pass: '' })
    const { signIn } = useFirebaseUser()

    return {
      form,
      signIn: async () => {
        await signIn()
        $bvModal.hide('signin')
      }
    }
  }
})
</script>
