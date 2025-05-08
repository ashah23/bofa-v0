import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
    return (
        <div className="container mx-auto px-4 py-8">
            <Skeleton className="h-10 w-32 mb-6" />

            <Card className="mb-8">
                <CardHeader>
                    <Skeleton className="h-8 w-64 mb-2" />
                    <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Skeleton className="h-6 w-32" />
                        <div className="grid gap-4">
                            {[...Array(3)].map((_, i) => (
                                <Card key={i}>
                                    <CardContent className="pt-6">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <Skeleton className="h-5 w-24 mb-2" />
                                                <Skeleton className="h-4 w-32" />
                                            </div>
                                            <div className="text-right">
                                                <Skeleton className="h-5 w-32 mb-2" />
                                                <Skeleton className="h-4 w-24" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
} 