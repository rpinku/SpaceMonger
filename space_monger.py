import pygame
import random

# Initialize Pygame
pygame.init()

# Set up display
WIDTH, HEIGHT = 800, 600
win = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Digger Game")

# Colors
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
GREEN = (0, 255, 0)
RED = (255, 0, 0)
YELLOW = (255, 255, 0)
BLUE = (0, 0, 255 ,)

# Player properties
player_size = 50
player_pos = [WIDTH // 2, HEIGHT // 2]
player_speed = 5
player_shape = [
    (1, 0), (2, 0), (3, 0), 
    (0, 1), (4, 1), 
    (1, 2), (2, 2), (3, 2), 
    (1, 3), (3, 3), 
    (0, 4), (4, 4)
]

# Enemy properties
enemy_size = 50
enemy_speed = 10
enemy_shape = [
    (0, 0), (4, 0),
    (0, 1), (4, 1),
    (2, 2),
    (1, 3), (3, 3),
    (1, 4), (3, 4)
]
enemies = [{"pos": [random.randint(0, WIDTH - enemy_size), 0], "start_delay": random.randint(30, 90)}]

# Gold properties
gold_size = 50
gold_pos = [random.randint(0, WIDTH - gold_size), 0]
gold_speed = 10
gold_start_delay = random.randint(60, 120)  # Delay between 2 and 4 seconds

# Game variables
score = 0
level = 1
lives = 3
game_over = False
clock = pygame.time.Clock()
level_up_display_time = 0

def check_collision(player_pos, player_size, obj_pos, obj_size):
    if (player_pos[0] < obj_pos[0] < player_pos[0] + player_size or 
        player_pos[0] < obj_pos[0] + obj_size < player_pos[0] + player_size):
        if (player_pos[1] < obj_pos[1] < player_pos[1] + player_size or 
            player_pos[1] < obj_pos[1] + obj_size < player_pos[1] + player_size):
            return True
    return False

def update_position(pos, size, speed, start_delay):
    if start_delay > 0:
        start_delay -= 1
    else:
        pos[1] += speed
        if pos[1] > HEIGHT:
            pos[0] = random.randint(0, WIDTH - size)
            pos[1] = 0
    return start_delay

def draw_spaceship(surface, pos, size, spaceship_shape, color):
    for (x, y) in spaceship_shape:
        pygame.draw.rect(surface, color, (pos[0] + x * size // 5, pos[1] + y * size // 5, size // 5, size // 5))

def draw_gold(surface, pos, size):
    # Draw gold coin
    pygame.draw.circle(surface, YELLOW, (pos[0] + size // 2, pos[1] + size // 2), size // 2)
    # Draw $ sign
    font = pygame.font.SysFont("comicsans", size // 2)
    text = font.render("$", True, BLACK)
    text_rect = text.get_rect(center=(pos[0] + size // 2, pos[1] + size // 2))
    surface.blit(text, text_rect)

def show_game_over(score):
    win.fill(BLACK)
    font = pygame.font.SysFont("comicsans", 75)
    score_text = font.render("Score: " + str(score), True, WHITE)
    game_over_text = font.render("Game Over", True, WHITE)
    win.blit(score_text, (WIDTH // 2 - score_text.get_width() // 2, HEIGHT // 2 - score_text.get_height() // 2 - score_text.get_height() - 10))
    win.blit(game_over_text, (WIDTH // 2 - game_over_text.get_width() // 2, HEIGHT // 2 - game_over_text.get_height() // 2))
    pygame.display.update()
    wait_for_key_press()

def wait_for_key_press():
    waiting = True
    while waiting:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                exit()
            if event.type == pygame.KEYDOWN:
                waiting = False

def next_level():
    global level, enemy_speed, enemies, score, level_up_display_time
    level += 1
    level_up_display_time = pygame.time.get_ticks()  # Record the time when the level up occurs
    if level <= 5:
        enemy_speed += 2
    elif level <= 9:
        enemies.append({"pos": [random.randint(0, WIDTH - enemy_size), 0], "start_delay": random.randint(30, 90)})
    elif level == 10:
        enemy_speed += 5  # Boss ship speed boost

def show_level_up():
    font = pygame.font.SysFont("comicsans", 75)
    level_up_text = font.render(f"Level {level}", True, WHITE)
    win.blit(level_up_text, (WIDTH // 2 - level_up_text.get_width() // 2, HEIGHT // 2 - level_up_text.get_height() // 2))

def show_stats():
    font = pygame.font.SysFont("comicsans", 30)
    stats_text = font.render(f"Level {level} Score {score}", True, WHITE)
    win.blit(stats_text, (10, 10))  # Positioning the text at the top-left corner

def show_lives():
    for i in range(lives):
        pygame.draw.rect(win, BLUE, (WIDTH - (i + 1) * 40, 10, 30, 30))

# Main game loop
while not game_over:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            game_over = True

    keys = pygame.key.get_pressed()
    if keys[pygame.K_LEFT] and player_pos[0] > 0:
        player_pos[0] -= player_speed
    if keys[pygame.K_RIGHT] and player_pos[0] < WIDTH - player_size:
        player_pos[0] += player_speed
    if keys[pygame.K_UP] and player_pos[1] > 0:
        player_pos[1] -= player_speed
    if keys[pygame.K_DOWN] and player_pos[1] < HEIGHT - player_size:
        player_pos[1] += player_speed

    for enemy in enemies:
        enemy['start_delay'] = update_position(enemy['pos'], enemy_size, enemy_speed, enemy['start_delay'])
        if check_collision(player_pos, player_size, enemy['pos'], enemy_size):
            lives -= 1
            if lives == 0:
                game_over = True
            else:
                player_pos = [WIDTH // 2, HEIGHT // 2]  # Reset player position

    gold_start_delay = update_position(gold_pos, gold_size, gold_speed, gold_start_delay)
    if check_collision(player_pos, player_size, gold_pos, gold_size):
        score += 1
        gold_pos = [random.randint(0, WIDTH - gold_size), 0]
        gold_start_delay = random.randint(60, 120)
        if score % 10 == 0:
            next_level()

    # Fill background
    win.fill(BLACK)

    # Draw player
    draw_spaceship(win, player_pos, player_size, player_shape, BLUE)

    # Draw enemies
    for enemy in enemies:
        if enemy['start_delay'] <= 0:
            draw_spaceship(win, enemy['pos'], enemy_size, enemy_shape, RED)

    # Draw gold
    if gold_start_delay <= 0:
        draw_gold(win, gold_pos, gold_size)

    # Show stats
    show_stats()

    # Show lives
    show_lives()

    # Show level up indication if within 2 seconds of level up
    if pygame.time.get_ticks() - level_up_display_time < 2000:
        show_level_up()

    # Update display
    pygame.display.update()

    # Tick clock
    clock.tick(30)

show_game_over(score)

pygame.quit()