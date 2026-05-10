import matplotlib.pyplot as plt

class GradeVisualizer:
    @staticmethod
    def plot_scores(student_scores):
        """
        student_scores: list of dictionaries
        """

        names = []
        scores = []

        for student in student_scores:
            names.append(student['name'])
            scores.append(student['score'])

        plt.bar(names, scores, color='blue')
        plt.xlabel('Students')
        plt.ylabel('Final Score')
        plt.title('Final Scores of Students')
        plt.savefig("student_scores.png")

# Example usage and test case
student_scores = [
    {"name": "Alice", "score": 92},
    {"name": "Bob", "score": 85},
    {"name": "Cindy", "score": 78}
]

GradeVisualizer.plot_scores(student_scores)