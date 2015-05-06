function getFlyLeftSpriteConfig() {
    return {
        "images": ["/uploads/assets/moorhuhn/sprites/fly_sprite_right_to_left.svg"],
        "frames": [
            [2, 2, 145, 143], 
            [149, 2, 158, 143],
            [309, 2, 158, 143], 
            [469, 2, 162, 140], 
            [633, 2, 164, 140], 
            [799, 2, 164, 140], 
            [965, 2, 160, 140],
            [1127, 2, 155, 140],
            [1284, 2, 140, 140], 
            [1426, 2, 140, 145], 
            [1568, 2, 133, 145], 
            [1703, 2, 130, 145], 
            [1835, 2, 135, 145],  
        ],
        "animations": {
            "flapLeft": [0, 12], 
        }
    };
}

function getFlyRightSpriteConfig() {
    return {
        "images": ["/uploads/assets/moorhuhn/sprites/fly_sprite_left_to_right.svg"],
        "frames": [
            [2, 2, 135, 143], 
            [139, 2, 135, 143],
            [276, 2, 133, 143], 
            [411, 2, 136, 140], 
            [549, 2, 145, 140], 
            [696, 2, 148, 140], 
            [846, 2, 160, 140],
            [1008, 2, 163, 140],
            [1173, 2, 168, 140], 
            [1340, 2, 163, 140], 
            [1505, 2, 163, 140], 
            [1670, 2, 155, 140], 
            [1824, 2, 150, 140], 
        ],
        "animations": {
            "flapRight": [0, 12], 
        }
    };
}

function getKillSpriteConfig() {
    return {
        "images": ["/uploads/assets/moorhuhn/sprites/kill_sprite.svg"],
        "frames": [
            [2, 2, 140, 160], 
            [144, 2, 130, 160], 
            [276, 2, 135, 160], 
            [413, 2, 160, 120], 
            [575, 2, 135, 110], 
            [712, 2, 110, 150], 
            [824, 2, 105, 155], 
            [931, 2, 100, 155]
        ],
        "animations": {
            "kill": [0, 7, false, 1],
        }
    }
}

