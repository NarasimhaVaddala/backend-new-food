// Find socketId by userId
export function getSocketIdByUserId(map, targetUserId) {
  for (const [socketId, data] of map.entries()) {
    console.log(socketId, data, "IN MAP LOOP");

    if (data.userId?.toString() === targetUserId?.toString()) {
      return socketId;
    }
  }
  return null; // Not found
}
