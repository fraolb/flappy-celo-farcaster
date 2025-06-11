const API_BASE_URL = "/api/score";

/**
 * Fetch all top scorers.
 * @returns A list of all top scorers.
 */
export async function getTopScorers() {
  try {
    const response = await fetch(`${API_BASE_URL}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch top scorers: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching top scorers:", error);
    throw new Error("Failed to fetch top scorers");
  }
}

/**
 * Fetch scores for a single user.
 * @param username - The username to fetch scores for.
 * @returns The user's scores.
 */
export async function getUserScores(username: string) {
  try {
    const response = await fetch(
      `${API_BASE_URL}?username=${encodeURIComponent(username)}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch user scores: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching user scores:", error);
    throw new Error("Failed to fetch user scores");
  }
}

/**
 * Add user score to the database.
 * @param username - The username of the player.
 * @param score - The score to be added for the user.
 * @returns The created score document.
 */
export async function addUserScore(
  username: string,
  score: number,
  token: string
) {
  try {
    const response = await fetch(`${API_BASE_URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        username,
        score,
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
