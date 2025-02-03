export const calculateBMI = (weight: number, height: number): number => {
  const heightInMeters = height / 100;
  return Number((weight / (heightInMeters * heightInMeters)).toFixed(1));
};

export const calculateBMR = (
  weight: number,
  height: number,
  age: number,
  gender: 'male' | 'female'
): number => {
  // Mifflin-St Jeor Equation
  const base = 10 * weight + 6.25 * height - 5 * age;
  return Math.round(gender === 'male' ? base + 5 : base - 161);
};

export const calculateTDEE = (bmr: number, activityLevel: string): number => {
  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    'very-active': 1.9,
  };
  return Math.round(bmr * multipliers[activityLevel as keyof typeof multipliers]);
};

const getBMICategory = (bmi: number): { category: string; message: string } => {
  if (bmi < 18.5) {
    return {
      category: 'Underweight',
      message: 'You may need to focus on healthy weight gain through proper nutrition.',
    };
  } else if (bmi >= 18.5 && bmi < 25) {
    return {
      category: 'Normal Weight',
      message: 'You are at a healthy weight. Focus on maintaining through balanced nutrition and regular exercise.',
    };
  } else if (bmi >= 25 && bmi < 30) {
    return {
      category: 'Overweight',
      message: 'Consider focusing on gradual weight loss through diet and exercise.',
    };
  } else {
    return {
      category: 'Obese',
      message: 'It is recommended to consult with a healthcare provider for a personalized weight management plan.',
    };
  }
};

const getGoalBasedRecommendations = (
  goal: string,
  bmi: number,
  tdee: number
): string[] => {
  const recommendations: string[] = [];

  switch (goal) {
    case 'weight-loss':
      recommendations.push(
        `Target calorie intake: ${Math.round(tdee - 500)} calories per day for safe weight loss`,
        'Focus on high-protein foods to preserve muscle mass',
        'Include plenty of fiber-rich vegetables to help with satiety',
        'Consider starting with 30 minutes of moderate cardio 3-4 times per week'
      );
      break;
    case 'weight-gain':
      recommendations.push(
        `Target calorie intake: ${Math.round(tdee + 500)} calories per day for healthy weight gain`,
        'Prioritize nutrient-dense foods over empty calories',
        'Include healthy fats like nuts, avocados, and olive oil',
        'Focus on compound exercises to build overall strength'
      );
      break;
    case 'muscle-gain':
      recommendations.push(
        `Target calorie intake: ${Math.round(tdee + 300)} calories per day to support muscle growth`,
        'Consume 1.6-2.2g of protein per kg of body weight',
        'Include complex carbohydrates to fuel workouts',
        'Focus on progressive overload in your strength training'
      );
      break;
    case 'maintenance':
      recommendations.push(
        `Target calorie intake: ${tdee} calories per day to maintain current weight`,
        'Balance your macronutrients for optimal health',
        'Maintain regular exercise routine',
        'Focus on consistency rather than dramatic changes'
      );
      break;
  }

  return recommendations;
};

export const calculateHealthMetrics = (
  weight: number,
  height: number,
  age: number,
  gender: 'male' | 'female',
  activityLevel: string,
  goal: string
) => {
  const bmiValue = calculateBMI(weight, height);
  const bmiInfo = getBMICategory(bmiValue);
  const bmr = calculateBMR(weight, height, age, gender);
  const tdee = calculateTDEE(bmr, activityLevel);
  const recommendations = getGoalBasedRecommendations(goal, bmiValue, tdee);

  return {
    bmi: {
      value: bmiValue,
      category: bmiInfo.category,
      message: bmiInfo.message,
    },
    bmr,
    tdee,
    recommendations,
  };
};