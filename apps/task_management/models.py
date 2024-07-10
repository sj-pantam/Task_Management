"""
This file defines the database models
"""

from .common import db, Field, auth
from pydal.validators import *
from datetime import date

### Define your table below
#
# db.define_table('thing', Field('name'))
#
## always commit your models to avoid problems later
#
# db.commit()
#

db.define_table(
	'groups',
	Field('ceo', 'reference auth_user', requires=IS_NOT_EMPTY())
)

db.define_table(
	'users',
	Field('user', 'reference auth_user'),
	Field('managerId', 'reference auth_user'),
	Field('thumbnail', 'text'),
	Field('groupId', 'reference groups')
)

db.define_table(
	'tasks',
	Field('title', 'text', requires=IS_NOT_EMPTY()),
	Field('description', 'text'),
	Field('deadline', 'date', requires=IS_DATE()),
	Field('date_created', 'date', requires=IS_DATE(), default=date.today()),
	Field('status', options=('pending', 'acknowledged', 'rejected', 'completed', 'failed')),
	Field('assigned_to', 'reference users', requires=IS_NOT_EMPTY()),
	Field('groupId', 'reference groups', requires=IS_NOT_EMPTY()),
	auth.signature,
)

db.define_table(
	'comments',
	Field('comment_text', 'text', requires=IS_NOT_EMPTY()),
	Field('taskId', 'reference tasks'),
	Field('author', 'text', requires=IS_NOT_EMPTY()),
	auth.signature,
)

db.commit()
