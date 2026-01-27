"use client";

import { useState } from "react";
import { UserRatingBadge } from "./user-rating-badge";
import { FriendsRatingsModal } from "./friends-ratings-modal";

type RatingDisplayProps = {
    userRating: number | null;
    friendsRatings: Array<{
        userId: string;
        userName: string | null;
        userImage: string | null;
        rating: number | null;
    }>;
    mediaTitle: string;
};

export function RatingDisplay({ userRating, friendsRatings, mediaTitle }: RatingDisplayProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <UserRatingBadge
                rating={userRating}
                friendsCount={friendsRatings.length}
                onClick={() => setIsModalOpen(true)}
            />
            <FriendsRatingsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                friendsRatings={friendsRatings}
                mediaTitle={mediaTitle}
            />
        </>
    );
}
