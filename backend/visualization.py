import os
import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt


class GradeVisualizer:
    @staticmethod
    def plot_scores(course_name, student_scores):
        if not student_scores:
            return None

        names = []
        scores = []

        for student in student_scores:
            names.append(student["name"])
            scores.append(student["score"])

        os.makedirs("static/plots", exist_ok=True)

        safe_course_name = course_name.replace(" ", "_").replace("/", "_")
        file_path = f"static/plots/{safe_course_name}_scores.png"

        plt.figure(figsize=(10, 6))
        plt.bar(names, scores)
        plt.xlabel("Students")
        plt.ylabel("Final Score")
        plt.title(f"Final Scores - {course_name}")
        plt.xticks(rotation=45)
        plt.tight_layout()
        plt.savefig(file_path)
        plt.close()

        return file_path