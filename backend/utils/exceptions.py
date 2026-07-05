class AppException(Exception):
    def __init__(self, message: str, code: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code

class LessonNotFoundException(AppException):
    def __init__(self, lesson_id: int):
        super().__init__(
            message=f"Lesson with ID {lesson_id} was not found.",
            code="LESSON_NOT_FOUND",
            status_code=404
        )

class InvalidFileException(AppException):
    def __init__(self, message: str):
        super().__init__(
            message=message,
            code="INVALID_FILE",
            status_code=400
        )
