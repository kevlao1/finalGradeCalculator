from collections import Counter
import matplotlib.pyplot as plt

class StatsTools:
    """
    Functions will receive data from the database
    """

    @staticmethod
    def total(database):
        """
        database: list of numbers
        calculate the total number of input data
        """
        if not database:
            return 0

        return sum(database)

    @staticmethod
    def average(database):
        """
        database: list of numbers
        calculate the average of input data
        """
        if not database:
            return 0

        return sum(database) / len(database)        

    @staticmethod
    def minimum(database):
        """
        database: list of numbers
        calculate the minimum of input data
        """
        if not database:
            return None

        return min(database)

    @staticmethod
    def maximum(database):
        """
        database: list of numbers
        calculate the maximum of input data
        """
        if not database:
            return None

        return max(database)

    @staticmethod
    def lower_quarter(database):
        """
        database: list of numbers
        calculate the lower quarter of input data
        """
        if not database:
            return None

        sorted_data = sorted(database)
        n = len(sorted_data)
        q1_index = n // 4
        return sorted_data[q1_index]

    @staticmethod
    def upper_quarter(database):
        """
        database: list of numbers
        calculate the upper quarter of input data
        """
        if not database:
            return None

        sorted_data = sorted(database)
        n = len(sorted_data)
        q3_index = 3 * n // 4
        return sorted_data[q3_index]

    @staticmethod
    def median(database):
        """
        database: list of numbers
        calculate the median of input data
        """
        if not database:
            return None

        sorted_data = sorted(database)
        n = len(sorted_data)
        mid_index = n // 2

        if n % 2 == 0:
            return (sorted_data[mid_index - 1] + sorted_data[mid_index]) / 2
        else:
            return sorted_data[mid_index]

    @staticmethod
    def percentage(database, value):
        """
        database: list of numbers
        value: number to calculate percentage for
        calculate the percentage of a specific value in the input data
        """
        if not database:
            return 0

        count = database.count(value)
        return (count / len(database)) * 100

    @staticmethod
    def position(database, grade):
        """
        database: list of numbers
        grade: number to find the position for
        calculate the position of a specific grade in the input data
        """
        if not database:
            return None

        sorted_data = sorted(database, reverse=True)
        try:
            position = sorted_data.index(grade) + 1
            return position
        except ValueError:
            return None

    @staticmethod
    def percentile(database, grade):
        """
        database: list of numbers
        grade: number to calculate percentile for
        calculate the percentile of a specific grade in the input data
        """
        if not database:
            return None

        sorted_data = sorted(database)
        n = len(sorted_data)
        count = sum(1 for x in sorted_data if x < grade)
        return (count / n) * 100 