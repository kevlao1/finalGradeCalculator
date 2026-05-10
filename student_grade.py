from collections import Counter
import matplotlib.pyplot as plt

class StudentGradeCalculator:
    """
    Functions will receive data from the database
    Functions will implement the personal grade of each student
    """

    @staticmethod   
    def total_score(database):
        """
        database: list of numbers
        calculate the total score of input data
        """
        if not database:
            return 0
        
        total = 0
        for item in database:
            score = item["score"]
            max_score = item["max_score"]
            weight = item["weight"]

            total += (score / max_score) * weight

        return total * 100

