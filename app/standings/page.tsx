import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Award, Medal, Skull } from "lucide-react"

async function getStandings() {
  // Get points data with team names in a single query
  const pointsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/points`, { cache: 'no-store' });
  if (!pointsRes.ok) throw new Error('Failed to fetch points');
  const pointsData = await pointsRes.json();

  // Group teams by points to handle ties
  const teamsByPoints = pointsData.points.reduce((acc: any, team: any) => {
    const points = team.total_points;
    if (!acc[points]) {
      acc[points] = [];
    }
    acc[points].push({
      team_id: team.team_id,
      name: team.team_name,
      points: team.total_points
    });
    return acc;
  }, {});

  // Sort points in descending order
  const sortedPoints = Object.keys(teamsByPoints).sort((a, b) => parseInt(b) - parseInt(a));

  // Calculate rankings with ties
  const standings: any[] = [];
  let currentRank = 1;

  sortedPoints.forEach((points) => {
    const teams = teamsByPoints[points];
    const isTie = teams.length > 1;
    
    teams.forEach((team: any) => {
      standings.push({
        ...team,
        rank: currentRank,
        isTie,
        tieCount: teams.length
      });
    });
    
    // Move to next rank (skip tied positions)
    currentRank += teams.length;
  });

  return standings;
}

export default async function StandingsPage() {
  const standings = await getStandings();

  const getRankDisplay = (team: any) => {
    const { rank, isTie, tieCount } = team;
    
    if (rank === 1) {
      if (isTie) {
        return (
          <div className="flex items-center">
            <Medal className="h-4 w-4 md:h-6 md:w-6 text-yellow-500 mr-1 md:mr-2" />
            <span className="font-bold text-yellow-600 text-sm md:text-base">T-1st</span>
          </div>
        );
      } else {
        return (
          <div className="flex items-center">
            <Medal className="h-4 w-4 md:h-6 md:w-6 text-yellow-500 mr-1 md:mr-2" />
            <span className="font-bold text-yellow-600 text-sm md:text-base">1st</span>
          </div>
        );
      }
    }
    
    if (rank === 2) {
      if (isTie) {
        return (
          <div className="flex items-center">
            <Award className="h-4 w-4 md:h-6 md:w-6 text-gray-400 mr-1 md:mr-2" />
            <span className="font-bold text-gray-600 text-sm md:text-base">T-2nd</span>
          </div>
        );
      } else {
        return (
          <div className="flex items-center">
            <Award className="h-4 w-4 md:h-6 md:w-6 text-gray-400 mr-1 md:mr-2" />
            <span className="font-bold text-gray-600 text-sm md:text-base">2nd</span>
          </div>
        );
      }
    }
    
    if (rank === 3) {
      if (isTie) {
        return (
          <div className="flex items-center">
            <Award className="h-4 w-4 md:h-6 md:w-6 text-amber-700 mr-1 md:mr-2" />
            <span className="font-bold text-amber-700 text-sm md:text-base">T-3rd</span>
          </div>
        );
      } else {
        return (
          <div className="flex items-center">
            <Award className="h-4 w-4 md:h-6 md:w-6 text-amber-700 mr-1 md:mr-2" />
            <span className="font-bold text-amber-700 text-sm md:text-base">3rd</span>
          </div>
        );
      }
    }
    
    // Handle last place (assuming 12 teams total)
    if (rank === 12) {
      return (
        <div className="flex items-center">
          <Skull className="h-4 w-4 md:h-6 md:w-6 mr-1 md:mr-2" />
          <span className="font-bold text-sm md:text-base">Last</span>
        </div>
      );
    }
    
    // For other ranks, show the actual rank number
    return <span className="w-4 md:w-5 mr-1 md:mr-2 text-sm md:text-base">{rank}</span>;
  };

  const getRowBackground = (team: any) => {
    const { rank, isTie } = team;
    
    if (rank === 1) return 'bg-yellow-50';
    if (rank === 2) return 'bg-gray-50';
    if (rank === 3) return 'bg-amber-50';
    
    return 'hover:bg-muted/50';
  };

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-4">Standings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 md:py-3 px-2 md:px-4 text-sm md:text-base">Rank</th>
                  <th className="text-left py-2 md:py-3 px-2 md:px-4 text-sm md:text-base">Team</th>
                  <th className="text-right py-2 md:py-3 px-2 md:px-4 text-sm md:text-base">Points</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((team: any) => (
                  <tr
                    key={team.team_id}
                    className={`border-b ${getRowBackground(team)}`}
                  >
                    <td className="py-2 md:py-3 px-2 md:px-4">
                      <div className="flex items-center">
                        {getRankDisplay(team)}
                      </div>
                    </td>
                    <td className="py-2 md:py-3 px-2 md:px-4 font-medium text-sm md:text-base">{team.name}</td>
                    <td className="py-2 md:py-3 px-2 md:px-4 text-right font-bold text-sm md:text-base">{team.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
