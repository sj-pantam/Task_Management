"""
This file defines actions, i.e. functions the URLs are mapped into
The @action(path) decorator exposed the function at URL:

    http://127.0.0.1:8000/{app_name}/{path}

If app_name == '_default' then simply

    http://127.0.0.1:8000/{path}

If path == 'index' it can be omitted:

    http://127.0.0.1:8000/

The path follows the bottlepy syntax.

@action.uses('generic.html')  indicates that the action uses the generic.html template
@action.uses(session)         indicates that the action uses the session
@action.uses(db)              indicates that the action uses the db
@action.uses(T)               indicates that the action uses the i18n & pluralization
@action.uses(auth.user)       indicates that the action requires a logged in user
@action.uses(auth)            indicates that the action requires the auth object

session, db, T, auth, and tempates are examples of Fixtures.
Warning: Fixtures MUST be declared with @action.uses({fixtures}) else your app will result in undefined behavior
"""

from py4web import action, request, abort, redirect, URL
from yatl.helpers import A
from .common import db, session, T, cache, auth, logger, authenticated, unauthenticated, flash
"""
for @action('upload_thumbnail', method="POST") 
from https://github.com/learn-py4web/contacts_with_images/blob/main/controllers.py
"""
from py4web.utils.url_signer import URLSigner
from datetime import date, datetime
url_signer = URLSigner(session)

@action("index") #sending home
@action.uses(auth.user)
def home():
    user = auth.get_user()
    if not user:
        redirect(URL('auth/login'))
    redirect(URL('static/home.html'))
    


# Task List (tasks = all tasks)
@action('tasks')
@action.uses('tasks.html', auth.user, db)
def task_list():
    user = auth.get_user()
    user_record = db(db.users.user == user['id']).select().first()
    if not user_record:
        groupId = db.groups.insert(ceo=user['id'])
        user_record = db.users(db.users.insert(user=user['id'], managerId=None, groupId=groupId))
    groupId = user_record['groupId']
    query = (db.tasks.id > 0)
    query &= (db.tasks.groupId == groupId)
    tasks = db(query).select().as_list()
    return dict(tasks=tasks)

# Task Detail (task = single task)
@action('tasks/<taskId:int>')
@action.uses('task.html', auth.user, db)
def task(taskId=None):
    if not taskId:
        redirect(URL('tasks/createTask'))
    task = db.tasks(taskId)
    comments = db(db.comments.taskId == taskId).select()
    if not task:
        redirect(URL('tasks/createTask'))
    return dict(task=task, comments=comments.as_list())

# Create Task
@action('tasks/createTask')
@action.uses('tasks.html', auth.user, db)
def createTask():
    user_record = db(db.users.id == auth.get_user()['id']).select().first()
    form = Form(db.tasks)
    users = db(db.users.groupId == user_record['groupId']).select()
    query = (db.auth_user.id > 0)
    for user in users:
        query &= (db.auth_user.id == user.id)
    allUsers = db(query).select()
    # print(f"{allUsers=}")
    # print(f'{form=}')
    if form.accepted:
        redirect(URL('tasks'))
    
    return dict(form=form, users=allUsers)

@action('api/tasks/<taskId:int>', method=["GET", "PUT"])
@action.uses(db, auth.user)
def _(taskId):
    if request.method == 'GET':
        task = db.tasks(taskId)
        task_data = task.as_dict()
        assigned_to_user = db.auth_user(task_data['assigned_to'])
        task_data['assigned_to_name'] = f"{assigned_to_user.first_name} {assigned_to_user.last_name}" if assigned_to_user else "Unknown"
        return dict(task=task_data)
    
    elif request.method == 'PUT':
        data = request.json
        task = db.tasks(taskId)
        task.update_record(
            title=data.get('title'),
            description=data.get('description'),
            deadline=data.get('deadline'),
            status=data.get('status'),
            assigned_to=data.get('assigned_to')
        )
        return dict(status='success')

# API stuff
@action('api/tasks', method=["GET", "POST", "DELETE", "PUT"])
@action.uses(db, auth.user)
def tasks():
    if request.method == 'GET':
        filters = request.params
        user = auth.get_user()
        user_record = db(db.users.user == user['id']).select().first()
        groupId = user_record.groupId
        query = (db.tasks.id > 0)
        query &= (db.tasks.groupId == groupId)
        if filters.get('created_by'):
            query &= (db.tasks.created_by == int(filters['created_by']))
        if filters.get('assigned_to'):
            query &= (db.tasks.assigned_to == int(filters['assigned_to']))
        if filters.get('status'):
            query &= (db.tasks.status == filters['status'])
        if filters.get('date_created'):
            query &= (db.tasks.date_created == filters['date_created'])
        if filters.get('deadline'):
            query &= (db.tasks.deadline <= filters['deadline'])
        if filters.get('groupId'):
            query &= (db.tasks.groupId == int(filters['groupId']))

        tasks = db(query).select().as_list()
        return dict(tasks=tasks)
    
    elif request.method == 'POST':
        data = request.json
        userId = data.get('assigned_to')
        groupId = db(db.users.id == userId).select(db.users.groupId).first()['groupId']
        task_id = db.tasks.insert(
            title=data.get('title'),
            description=data.get('description'),
            deadline=data.get('deadline'),
            status=data.get('status'),
            assigned_to=data.get('assigned_to'),
            groupId=groupId
        )
        return dict(task_id=task_id)
    
    elif request.method == 'DELETE':
        task_id = request.params.get('task_id')
        task = db.tasks(task_id)
        if task.created_by == auth.user_id or db(db.users.managerId == auth.user_id).select():
            db(db.tasks.id == task_id).delete()
            db.commit()
            return dict(status='completed')
        return dict(status='failed')
    
    elif request.method == 'PUT':
        task_id = request.params.get('task_id')
        task = db.tasks(task_id)
        if task.created_by == auth.user_id or db(db.users.managerId == auth.user_id).select():
            data = request.json
            task.update_record(
                title=data.get('title'),
                description=data.get('description'),
                deadline=data.get('deadline'),
                status=data.get('status'),
                assigned_to=data.get('assigned_to'),
                groupId=data.get('groupId')
            )
            db.commit()
            return dict(status='completed')
        return dict(status='failed')

@action('api/viewManager' , method=["GET"])
@action.uses(db, auth.user)
def viewManager():

    # Get logged in user data
    user = auth.get_user()
    user_id = int(user['id'])
    # return {"id": user_id}

    # Fetch the user from the 'users' table
    user_record = db(db.users.user == user_id).select().first()
    if not user_record: 
        return {"status": "error", "message": "User not found"}

    # Get Manager ID
    manager_id = user_record.managerId
    if not manager_id:
        return {"status": "error", "message": "Manager not assigned for this user"}

    # Fetch the manager from the 'auth_user' table
    manager_record = db.auth_user[manager_id]

    if not manager_record:
        return {"status": "error", "message": "Manager not found"}

    return {
        "status": "success",
        "message": f"Manager for User {user['first_name']} {user['last_name']} is {manager_record['first_name']} {manager_record['last_name']}",
        "manager_data": {
            "first_name": manager_record['first_name'],
            "last_name": manager_record['last_name'],
            "email": manager_record['email'],
        }
    }

  
@action('api/assignManagers', method=["POST", "DELETE"])
@action.uses(db, auth.user)
def assign_managers():
    user_email = auth.get_user()['email']
    
    if request.method == 'POST':
        data = request.json
        manager_email = data.get('email').lower()  # database saves emails lowercase
        
        if manager_email == user_email:
            return {"status": "error", "message": "You cannot assign yourself as your own manager"}

        user = db(db.auth_user.email == user_email).select().first()
        manager = db(db.auth_user.email == manager_email).select().first()
        
        if not user or not manager:
            return {"status": "error", "message": "User or Manager not found"}

        user_id = user.id
        manager_id = manager.id

        # Check for cyclic dependencies
        if has_cycle(user_id, manager_id):
            return {"status": "error", "message": "Cyclic dependency detected"}

        # Exists or Update?
        user_in_users = db(db.users.user == user_id).select().first()
        if user_in_users:  # Update
            user_in_users.update_record(managerId=manager_id)
        else:  # Create
            db.users.insert(user=user_id, managerId=manager_id)

        db.commit()
        
        return {
            "status": "success",
            "message": f"Manager {manager.first_name} {manager.last_name} assigned to User {user.first_name} {user.last_name} successfully",
            "manager": {
                "id": manager.id,
                "first_name": manager.first_name,
                "last_name": manager.last_name,
                "email": manager.email
            }
        }
    
    elif request.method == 'DELETE':
        user = db(db.auth_user.email == user_email).select().first()
        user_in_users = db(db.users.user == user.id).select().first()
        
        if user_in_users:
            user_in_users.update_record(managerId=None)
            db.commit()
            return {"status": "success", "message": "Manager cleared successfully"}
        
        return {"status": "error", "message": "No manager to clear"}

def has_cycle(user_id, manager_id):
    """
    Check if assigning manager_id as a manager to user_id would create a cyclic dependency.
    """
    # print(f"Checking cycle for User ID: {user_id} with Manager ID: {manager_id}")
    
    def visit(current_user_id, target_manager_id):
        # print(f"Visiting User ID: {current_user_id}, checking against Manager ID: {target_manager_id}")
        if current_user_id == target_manager_id:
            return True
        
        # Get the manager of the current user
        user_record = db(db.users.user == current_user_id).select().first()
        if user_record and user_record.managerId:
            return visit(user_record.managerId, target_manager_id)
        return False
    
    return visit(manager_id, user_id)
      

@action('api/users', method=["GET"])
@action.uses(db, auth.user)
def _():
    currUser  = auth.get_user()
    user = db(db.users.id == currUser['id']).select().first()
    userIds = db(db.users.groupId == user.groupId).select()
    users = []
    for userId in userIds:
        temp = db(db.auth_user.id == userId.id).select(db.auth_user.id, db.auth_user.email, db.auth_user.first_name, db.auth_user.last_name, db.auth_user.username).as_list()
        users.extend(temp)
    print(f"{users=}")
    return dict(users=users)

@action('api/comments/<taskId>', method=["GET", "POST"])
@action.uses(db, auth.user)
def comments(taskId):
    if request.method == "GET":
        comments = db(db.comments.taskId == taskId).select(db.comments.ALL).as_list()
        return {"comments": comments}
    if request.method == "POST":
        currUser = auth.get_user()['first_name'] + ' ' + auth.get_user()['last_name']
        data = request.json
        comment_text = data.get("comment", "")
        if not comment_text:
            return {"error": "Comment text is empty"}, 400
        print(f'{currUser=}')
        comment_id = db.comments.insert(taskId=taskId, comment_text=comment_text, author=currUser)
        db.commit()
        return {"id": comment_id}

@action('api/currUser', method=["GET"])
@action.uses(db, auth.user)
def _():
    currUser = auth.get_user()['first_name'] + ' ' + auth.get_user()['last_name']
    return dict(currUser=currUser)


@action('api/check_edit_permission/<taskId:int>', method=["GET"])
@action.uses(db, auth.user)
def check_edit_permission(taskId):
    user = auth.get_user()
    task = db.tasks(taskId)
    if not task:
        abort(404)
    
    if task.created_by == user['id']:
        return dict(can_edit=True)
    
    user_record = db(db.users.user == user['id']).select().first()
    if user_record and user_record.managerId == task.assigned_to:
        return dict(can_edit=True)
    
    return dict(can_edit=False)

# Profile API additions:
@action('<username>/profile', method=["GET"])
@action.uses('profile.html', auth.user, db, url_signer)
def profile(username):
    logged_in_user = auth.get_user()
    # .lower() added as database stores everything in lowercase
    upload_url = URL('upload_thumbnail', signer=url_signer)
    return dict(username=username.lower(), loggedInUsername=logged_in_user['username'], uploadUrl=upload_url)

@action('api/profile/<username>', method=["GET"])
@action.uses(auth.user, db)
def api_profile(username):
    user = db(db.auth_user.username == username.lower()).select().first()
    if not user:
        return {"status": "error", "message": "User not found"}

    user_id = user.id

    # Fetch the user from the 'users' table
    user_record = db(db.users.user == user_id).select().first()
    
    # Initialize manager info as empty
    manager_info = {
        "username": "",
        "first_name": "",
        "last_name": "",
        "email": ""
    }
    
    if user_record:
        # Get Manager ID
        manager_id = user_record.managerId
        if manager_id:
            # Fetch the manager from the 'auth_user' table
            manager_record = db.auth_user[manager_id]
            if manager_record:
                manager_info = {
                    "username": manager_record.username,
                    "first_name": manager_record.first_name,
                    "last_name": manager_record.last_name,
                    "email": manager_record.email
                }

    profile_data = dict(
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        manager_username=manager_info['username'],
        manager_first_name=manager_info['first_name'],
        manager_last_name=manager_info['last_name'],
        manager_email=manager_info['email']
    )

    return profile_data

# Home Page additions
@action("home")
@action.uses(auth.user)
def home():
    user = auth.get_user()
    if not user:
        redirect(URL('auth/login'))
    redirect(URL('static/home.html'))

@action("api/homeuser")
@action.uses(auth.user)
def api_homeuser():
    user = auth.get_user()
    return dict(username=user['username'], loggedInUsername=user['username'])

@action('api/manager_info', method=["GET"])
@action.uses(db, auth.user)
def manager_info():
    user = auth.get_user()
    user_id = int(user['id'])
    
    user_record = db(db.users.user == user_id).select().first()
    if not user_record:
        return {"status": "error", "message": "User not found"}

    manager_id = user_record.managerId
    if not manager_id:
        return {"status": "error", "message": "Manager not assigned for this user"}

    manager_record = db.auth_user[manager_id]
    if not manager_record:
        return {"status": "error", "message": "Manager not found"}

    return {
        "status": "success",
        "manager_data": {
            "username": manager_record.username,
            "first_name": manager_record.first_name,
            "last_name": manager_record.last_name,
            "email": manager_record.email,
        }
    }

# Profile Picture logic
@action('api/getProfilePicture/<username>', method=["GET"])
@action.uses(auth.user, db)
def get_profile_picture(username):
    user = db(db.auth_user.username == username).select().first()
    if not user:
        return {"status": "error", "message": "User not found"}

    user_record = db(db.users.user == user.id).select().first()
    if not user_record or not user_record.thumbnail:
        return {"status": "error", "message": "No profile picture"}

    return {"status": "success", "thumbnail": user_record.thumbnail}


@action('api/clearProfilePicture', method=["DELETE"])
@action.uses(auth.user, db)
def clear_profile_picture():
    user = auth.get_user()
    user_record = db(db.users.user == user['id']).select().first()
    if user_record and user_record.thumbnail:
        user_record.update_record(thumbnail=None)
        db.commit()
        return {"status": "success", "message": "Profile picture cleared"}

    return {"status": "error", "message": "No profile picture to clear"}

# Taken from: https://github.com/learn-py4web/contacts_with_images
@action('upload_thumbnail', method=["POST"])
@action.uses(url_signer.verify(), db, auth.user)
def upload_thumbnail():
    user_email = auth.get_user()['email']
    data = request.json  # Read the JSON data from the request body
    thumbnail = data.get("thumbnail")  # Extract the thumbnail value from the JSON data

    if not thumbnail:
        print("No thumbnail provided")
        return {"status": "error", "message": "No thumbnail provided"}

    user = db(db.auth_user.email == user_email).select().first()
    if not user:
        print(f"User not found for email: {user_email}")
        return {"status": "error", "message": "User not found"}

    user_record = db(db.users.user == user.id).select().first()
    if user_record:
        print(f"Updating thumbnail for user ID: {user.id}")
        user_record.update_record(thumbnail=thumbnail)
    else:
        print(f"Inserting new user record for user ID: {user.id}")
        db.users.insert(user=user.id, thumbnail=thumbnail)

    db.commit()
    print(f"Thumbnail uploaded successfully for user ID: {user.id}")
    return {"status": "success", "message": "Thumbnail uploaded successfully"}

# Managed Users api
@action('api/managed_users', method=["GET"])
@action.uses(auth.user, db)
def managed_users():
    user_id = auth.get_user()['id']
    managed_users = db(db.users.managerId == user_id).select(
        db.users.ALL, 
        db.auth_user.ALL,
        left=db.users.on(db.users.user == db.auth_user.id)
    )
    users_list = []
    for user in managed_users:
        users_list.append({
            "username": user.auth_user.username,
            "first_name": user.auth_user.first_name,
            "last_name": user.auth_user.last_name,
            "email": user.auth_user.email,
            "thumbnail": user.users.thumbnail
        })

    if not users_list:
        return {"status": "error", "message": "No managed users"}

    return {"status": "success", "users": users_list}


# directory stuff
@action('api/all_users', method=["GET"])
@action.uses(auth.user, db)
def all_users():
    users = db(db.auth_user).select().as_list()
    user_records = db(db.users).select().as_list()
    user_dict = {u['user']: u for u in user_records}

    all_users_data = []
    for user in users:
        user_id = user['id']
        user_data = {
            "username": user['username'],
            "first_name": user['first_name'],
            "last_name": user['last_name'],
            "email": user['email'],
            "thumbnail": user_dict[user_id]['thumbnail'] if user_id in user_dict and user_dict[user_id]['thumbnail'] else "",
            "manager_username": "N/A",
            "manager_first_name": "N/A",
            "manager_last_name": "",
            "manager_email": "N/A"
        }

        if user_id in user_dict:
            manager_id = user_dict[user_id]['managerId']
            if manager_id:
                manager = db.auth_user[manager_id]
                if manager:
                    user_data["manager_username"] = manager['username']
                    user_data["manager_first_name"] = manager['first_name']
                    user_data["manager_last_name"] = manager['last_name']
                    user_data["manager_email"] = manager['email']
        
        all_users_data.append(user_data)

    # hopefully the mapping isn't two slow because it uses 2 databases
    
    return {"status": "success", "users": all_users_data}
    

