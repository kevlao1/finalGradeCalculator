class StatsTools:
    """
    Utility functions for calculating statistics from database query results.
    Input should usually be a list of numbers, such as [90, 85, 100].
    """

    @staticmethod
    def total(database):
        if not database:
            return 0
        return sum(database)

    @staticmethod
    def average(database):
        if not database:
            return 0
        return sum(database) / len(database)

    @staticmethod
    def minimum(database):
        if not database:
            return None
        return min(database)

    @staticmethod
    def maximum(database):
        if not database:
            return None
        return max(database)

    @staticmethod
    def lower_quarter(database):
        if not database:
            return None

        sorted_data = sorted(database)
        n = len(sorted_data)
        q1_index = n // 4
        return sorted_data[q1_index]

    @staticmethod
    def upper_quarter(database):
        if not database:
            return None

        sorted_data = sorted(database)
        n = len(sorted_data)
        q3_index = 3 * n // 4
        return sorted_data[q3_index]

    @staticmethod
    def median(database):
        if not database:
            return None

        sorted_data = sorted(database)
        n = len(sorted_data)
        mid_index = n // 2

        if n % 2 == 0:
            return (sorted_data[mid_index - 1] + sorted_data[mid_index]) / 2
        return sorted_data[mid_index]

    @staticmethod
    def percentage(database, value):
        if not database:
            return 0

        count = database.count(value)
        return (count / len(database)) * 100

    @staticmethod
    def position(database, grade):
        if not database:
            return None

        sorted_data = sorted(database, reverse=True)

        try:
            return sorted_data.index(grade) + 1
        except ValueError:
            return None

    @staticmethod
    def percentile(database, grade):
        if not database:
            return None

        sorted_data = sorted(database)
        n = len(sorted_data)
        count = sum(1 for x in sorted_data if x < grade)
        return (count / n) * 100