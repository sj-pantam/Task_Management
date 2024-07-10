new Vue({
    el: '#app',
    data: {
        users: [],
        taskData: {
            title: '',
            description: '',
            assigned_to: '',
            deadline: '',
            status: 'pending',
        },
        taskId: null,
        errorMessage: ''
    },
    mounted() {
        this.populateUsers();
        const urlParams = new URLSearchParams(window.location.search);
        this.taskId = urlParams.get("taskId");
        if (this.taskId) {
            this.fetchTask(this.taskId);
        }
    },
    methods: {
        getBaseURL() {
            return window.location.origin + '/' + window.location.pathname.split('/')[1];
        },
        populateUsers() {
            const url = this.getBaseURL() + "/api/users";
            fetch(url)
                .then(res => res.json())
                .then(data => {
                    if (data.users.length === 0) {
                        this.users = [{ id: "1", name: "John Doe" }];
                    } else {
                        this.users = data.users;
                    }
                })
                .catch(error => {
                    console.error("Error fetching users:", error);
                    this.users = [{ id: "1", name: "John Doe" }];
                });
        },
        fetchTask(taskId) {
            const url = this.getBaseURL() + `/api/tasks/${taskId}`;
            fetch(url)
                .then(response => response.json())
                .then(data => {
                    this.taskData = {
                        title: data.task.title,
                        description: data.task.description,
                        assigned_to: data.task.assigned_to,
                        deadline: data.task.deadline,
                        status: data.task.status,
                    };
                })
                .catch(error => {
                    console.error('Error fetching task:', error);
                    this.errorMessage = 'An error occurred while fetching the task.';
                });
        },
        handleSubmit() {
            if (this.taskId) {
                this.updateTask(this.taskId, this.taskData);
            } else {
                this.createTask(this.taskData);
            }
        },
        createTask(taskData) {
            const url = this.getBaseURL() + "/api/tasks";
            fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(taskData),
            })
                .then(response => response.json())
                .then(data => {
                    window.location.href = "tasks.html";
                })
                .catch(error => {
                    console.error('Error creating task:', error);
                    this.errorMessage = 'An error occurred while creating the task.';
                });
        },
        updateTask(taskId, taskData) {
            const url = this.getBaseURL() + `/api/tasks/${taskId}`;
            fetch(url, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(taskData),
            })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        window.location.href = "tasks.html";
                    } else {
                        this.errorMessage = 'An error occurred while updating the task.';
                    }
                })
                .catch(error => {
                    console.error('Error updating task:', error);
                    this.errorMessage = 'An error occurred while updating the task.';
                });
        }
    }
});
