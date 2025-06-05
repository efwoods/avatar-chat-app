class Database:
    _singleton_instance_id = None

    def __init__(self):
        self.postgres_pool = None
        self.mongo_client = None
        self.mongo_db = None
        current_id = id(self)
        if Database._singleton_instance_id is None:
            Database._singleton_instance_id = current_id
        elif Database._singleton_instance_id != current_id:
            raise RuntimeError(f"Multiple Database instances created: {Database._singleton_instance_id} vs {current_id}")
    def get_id(self):
        return id(self)
db = Database()