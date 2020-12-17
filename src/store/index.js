import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export default new Vuex.Store({
    state: {
        tc: {
            raw: '',
            send_status: 'waiting',
            waiting_timeout: null,
            connection: null,
        },
        tm: {
            connection: null,
            sim_time_s: 0.0,
        },
    },
    mutations: {},
    actions: {
        connect_tc(context) {
            // Connect to websocket
            console.log('Starting WebSocket TC connection');
            context.state.tc.connection = new WebSocket('ws://localhost:5021');

            // Add a callback for when connected
            context.state.tc.connection.onopen = () => {
                console.log('WebSocket TC Connection opened');
            };
            // Callback for when recieveing a message from the websocket
            context.state.tc.connection.onmessage = event => {
                // Get the return code from the message
                var return_code = JSON.parse(event.data);
                console.log(`WebSocket TC return code: ${return_code}`);

                // Set the send status based on the return code
                switch (return_code) {
                    case 'Ok':
                        context.state.tc.send_status = 'sent';
                        break;
                    default:
                        context.state.tc.send_status = 'error';
                        break;
                }

                // Set the timeout to return to the waiting state
                context.state.tc.waiting_timeout = setTimeout(() => {
                    context.state.tc.send_status = 'waiting';
                }, 1000);
            };
        },
        send_raw_tc(context, raw_tc) {
            // Clear timeout if needed
            if (context.state.tc.waiting_timeout !== null) {
                clearTimeout(context.state.tc.waiting_timeout);
            }

            // If not connected emmit error event
            if (context.state.tc.connection === null) {
                console.log('Cannot send TC - disconnected');
            } else {
                // Set the raw TC
                context.state.tc.raw = raw_tc;

                // Send the TC
                context.state.tc.connection.send(raw_tc);

                // Set the send status as sending
                context.state.tc.send_status = 'sending';
            }
        },
        connect_tm(context) {
            // Connect to websocket
            console.log('Starting WebSocket TM connection');
            context.state.tm.connection = new WebSocket('ws://localhost:5031');

            // Add a callback for when connected
            context.state.tm.connection.onopen = () => {
                console.log('WebSocket TM Connection opened');
            };
            // Callback for when recieveing a message from the websocket
            context.state.tm.connection.onmessage = event => {
                // Get the return code from the message
                var tm = JSON.parse(event.data);
                context.state.tm = Object.assign(context.state.tm, tm);
            };
        },
    },
    modules: {},
});
