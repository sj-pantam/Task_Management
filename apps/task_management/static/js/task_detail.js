new Vue({
    el: "#app",
    data: {
        task: null,
        comments: [],
        newComment: "",
        errorMessage: "",
        canEdit: false,
        currUser: "",
    },
    mounted() {
        const urlParams = new URLSearchParams(window.location.search);
        const taskId = urlParams.get("taskId");
        if (taskId) {
            this.fetchTask(taskId);
            this.fetchComments(taskId);
            this.fetchCurrUser();
        }
    },
    methods: {
        getBaseURL() {
            return (
                window.location.origin +
                "/" +
                window.location.pathname.split("/")[1]
            );
        },
        fetchCurrUser() {
            const url = this.getBaseURL() + "/api/currUser";
            fetch(url)
                .then((response) => response.json())
                .then((data) => {
                    this.currUser = data.currUser;
                });
        },
        fetchTask(taskId) {
            const url = this.getBaseURL() + `/api/tasks/${taskId}`;
            fetch(url)
                .then((response) => response.json())
                .then((data) => {
                    this.task = data.task;
                    this.checkEditPermission();
                })
                .catch((error) => {
                    console.error("Error fetching task:", error);
                    this.errorMessage =
                        "An error occurred while fetching the task.";
                });
        },
        fetchComments(taskId) {
            const url = this.getBaseURL() + `/api/comments/${taskId}`;
            fetch(url)
                .then((response) => response.json())
                .then((data) => {
                    this.comments = data.comments;
                })
                .catch((error) => {
                    console.error("Error fetching comments:", error);
                    this.errorMessage =
                        "An error occurred while fetching comments.";
                });
        },
        addComment() {
            const url = this.getBaseURL() + `/api/comments/${this.task.id}`;
            fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ comment: this.newComment }),
            })
                .then((response) => response.json())
                .then((data) => {
                    this.comments.push({
                        comment_text: this.newComment,
                        author: this.currUser,
                    });
                    this.newComment = "";
                })
                .catch((error) => {
                    console.error("Error adding comment:", error);
                    this.errorMessage =
                        "An error occurred while adding the comment.";
                });
        },
        checkEditPermission() {
            const url =
                this.getBaseURL() +
                `/api/check_edit_permission/${this.task.id}`;
            fetch(url)
                .then((response) => response.json())
                .then((data) => {
                    this.canEdit = data.can_edit;
                })
                .catch((error) => {
                    console.error("Error checking edit permission:", error);
                    this.errorMessage =
                        "An error occurred while checking edit permissions.";
                });
        },
        editTask() {
            window.location.href = `create_task.html?taskId=${this.task.id}`;
        },
        goBack() {
            window.location.href = "tasks.html";
        },
    },
});
