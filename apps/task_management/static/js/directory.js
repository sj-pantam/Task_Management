document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and parsed');

    new Vue({
        el: '#app',
        data: {
            users: []
        },
        mounted() {
            console.log('Vue instance mounted');
            this.getUsers();
        },
        methods: {
            getBaseURL() {
                return window.location.origin + '/' + window.location.pathname.split('/')[1];
            },
            getUsers() {
                const url = this.getBaseURL() + `/api/all_users`;
                console.log(`Fetching users data from ${url}`);
                fetch(url, {
                    headers: {
                        'Accept': 'application/json'
                    }
                })
                .then(response => {
                    console.log('Received response:', response);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Received users data:', data);
                    if (data.status === 'success') {
                        this.users = data.users;
                    } else {
                        console.log('Error fetching users data:', data.message);
                    }
                })
                .catch(error => console.error('Error fetching users data:', error));
            }
        }
    });

    console.log('directory.js code executed');
});