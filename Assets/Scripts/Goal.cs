using System.Collections;
using UnityEngine;
using UnityEngine.Events;

[RequireComponent(typeof(Collider))]
public class Goal : MonoBehaviour
{
    [SerializeField] private string scoringTeam = "Player";
    [SerializeField] private int pointsPerGoal = 1;
    [SerializeField] private Transform ballResetPoint;
    [SerializeField] private ParticleSystem confettiEffect;
    [SerializeField] private Camera replayCamera;
    [SerializeField] private float slowMotionDuration = 0.75f;
    [SerializeField] private float slowMotionScale = 0.35f;

    [SerializeField] private UnityEvent<string, int> onScoreChanged;

    private static int _playerScore;
    private static int _aiScore;

    private void Reset()
    {
        Collider goalCollider = GetComponent<Collider>();
        goalCollider.isTrigger = true;
    }

    private void OnTriggerEnter(Collider other)
    {
        if (!other.TryGetComponent(out Ball ball))
        {
            return;
        }

        RegisterGoal();

        if (confettiEffect != null)
        {
            confettiEffect.Play();
        }

        if (ballResetPoint != null)
        {
            ball.ResetBall(ballResetPoint.position);
        }

        StartCoroutine(PlayGoalReplay());
    }

    private void RegisterGoal()
    {
        if (string.Equals(scoringTeam, "AI", System.StringComparison.OrdinalIgnoreCase))
        {
            _aiScore += pointsPerGoal;
            onScoreChanged?.Invoke("AI", _aiScore);
        }
        else
        {
            _playerScore += pointsPerGoal;
            onScoreChanged?.Invoke("Player", _playerScore);
        }
    }

    private IEnumerator PlayGoalReplay()
    {
        float originalScale = Time.timeScale;
        float originalFixedDelta = Time.fixedDeltaTime;
        if (replayCamera != null)
        {
            replayCamera.enabled = true;
        }

        Time.timeScale = slowMotionScale;
        Time.fixedDeltaTime = originalFixedDelta * Time.timeScale;
        yield return new WaitForSecondsRealtime(slowMotionDuration);

        Time.timeScale = originalScale;
        Time.fixedDeltaTime = originalFixedDelta;

        if (replayCamera != null)
        {
            replayCamera.enabled = false;
        }
    }

    public static (int player, int ai) GetScores()
    {
        return (_playerScore, _aiScore);
    }
}
