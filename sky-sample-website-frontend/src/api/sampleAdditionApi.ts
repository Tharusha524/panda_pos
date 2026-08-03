import axios from "axios";

export const addNumbers = async (num1: number, num2: number) => {
  try {
    const response = await axios.post("https://perahara.lk/restapi/index.php", {
      number1: num1,
      number2: num2,
    });
    return response.data;
  } catch (error) {
    console.error("Error calling the API", error);
    throw error;
  }
};
