export async function getAllQuestions(){
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/questions`)
    const data = await response.json()
    return data

}