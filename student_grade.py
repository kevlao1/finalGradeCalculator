from collections import Counter
import psycopg2

# DEPRECATED, CURRENTLY NOT IN USE (possible reallocation towards other purposes?)

class StudentGradeCalculator:
    """
    Functions will receive data from the database
    Functions will implement the personal grade of each student
    """

    @staticmethod   
    def category_score(database):
        """
        database: list of grades in one assignment category
        calculate the total score of input data

        CONSIDERATION: Extra credit assignments -> manual correction option?
        """
        # Automatic return if empty
        if not database: 
            return {"message": "No grades found!"}
        
        # Sum of all assignment percentages
        total = 0
        for item in database:
            score = item["score"]
            max_score = item["max_score"]
            if max_score == 0:
                return {"message": "0 found! Calculations stopped prematurely."}
            total += (score / max_score)
        # Divide by number of assignments
        total /= len(database)
        # Return total score (in %)
        return total * 100
    

