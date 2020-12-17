<template>
    <v-text-field
        v-model="raw_tc"
        outlined
        dense
        placeholder="Enter Text TC"
        @keyup.enter="send"
    >
        <template v-slot:append>
            <v-icon
                v-if="send_status != 'sending'"
                :color="send_colour"
                @click="send"
            >
                {{ icon }}
            </v-icon>
            <v-progress-circular
                v-if="send_status == 'sending'"
                :size="28"
                indeterminate
            />
        </template>
    </v-text-field>
</template>

<script>
export default {
    data() {
        return {
            raw_tc: '',
        };
    },
    computed: {
        send_colour() {
            switch (this.$store.state.tc.send_status) {
                case 'waiting':
                    return 'primary';
                case 'sending':
                    return 'grey';
                case 'sent':
                    return 'green';
                case 'error':
                    return 'red';
                default:
                    return 'red';
            }
        },
        icon() {
            switch (this.$store.state.tc.send_status) {
                case 'waiting':
                    return 'mdi-send';
                case 'sent':
                    return 'mdi-check';
                case 'error':
                    return 'mdi-alert-circle';
                default:
                    return '';
            }
        },
        send_status() {
            return this.$store.state.tc.send_status;
        },
    },
    methods: {
        send() {
            this.$store.dispatch('send_raw_tc', this.raw_tc);
        },
    },
};
</script>

<style></style>
