const API_BASE_URL = "/api/score";

/**
 * Fetch top scorers of the.
 * @returns A list of weekly top scorers.
 */
export async function getTopScorers() {
  try {
    const response = await fetch(`${API_BASE_URL}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch top scorers: ${response.statusText}`);
    }
    console.log(" the fetched top scorers ", response);
    return await response.json();
  } catch (error) {
    console.error("Error fetching top scorers:", error);
    throw new Error("Failed to fetch top scorers");
  }
}

/**
 * Add user score to the database.
 * @param username - The username of the player.
 * @param score - The score to be added for the user.
 * @returns The updated top scorer.
 */
export async function addUserScore(username: string, score: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/${username}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        _id: username,
        username: username,
        score: score, // Increment score by 1
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to add user score: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error adding user score:", error);
    throw new Error("Failed to add user score");
  }
}
