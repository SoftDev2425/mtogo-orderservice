export async function fetchDataFromService(url: string, options: RequestInit) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Error fetching data from ${url}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch data from ${url}:`, error);
    //@ts-expect-error - throw error
    throw new Error(error.message);
  }
}
