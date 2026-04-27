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
        calculate the total number of input data
        """
        if not database:
            return None

        return min(database)

    @staticmethod
    def maximum(database):
        """
        database: list of numbers
        calculate the total number of input data
        """
        if not database:
            return None

        return max(database)

    @staticmethod
    def lower_quarter(database):
        pass

    @staticmethod
    def upper_quarter(database):
        pass

