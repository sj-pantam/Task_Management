new Vue({
    el: '#app',
    data: {
        filters: {
            created_by: '',
            assigned_to: '',
            status: '',
            date_created: '',
            deadline: ''
        },
        tasks: [],
        users: [],
        errorMessage: ''
    },
    mounted() {
        this.fetchUsers();
        this.fetchTasks();
    },
    methods: {
        getBaseURL() {
            return window.location.origin + '/' + window.location.pathname.split('/')[1];
        },
        fetchTasks() {
            const query = Object.keys(this.filters)
                .filter(key => this.filters[key])
                .map(key => {
                    if (key === 'date_created' || key === 'deadline') {
                        return `${key}=${encodeURIComponent(this.filters[key])}`;
                    }
                    return `${key}=${encodeURIComponent(this.filters[key])}`;
                })
                .join('&');

            const url = this.getBaseURL() + `/api/tasks?${query}`;
            fetch(url)
                .then(response => response.json())
                .then(data => {
                    this.tasks = data.tasks;
                })
                .catch(error => {
                    console.error('Error fetching tasks:', error);
                    this.errorMessage = 'An error occurred while fetching tasks.';
                });
        },
        fetchUsers() {
            const url = this.getBaseURL() + '/api/users';
            fetch(url)
                .then(response => response.json())
                .then(data => {
                    this.users = data.users.map(user => ({
                        id: user.id,
                        name: `${user.first_name} ${user.last_name}`
                    }));
                })
                .catch(error => {
                    console.error('Error fetching users:', error);
                    this.errorMessage = 'An error occurred while fetching users.';
                });
        },
        goToCreateTask() {
            window.location.href = 'create_task.html';
        },
        goToTaskDetail(taskId) {
            window.location.href = `task_detail.html?taskId=${taskId}`;
        }
    }
});
