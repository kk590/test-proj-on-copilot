using UnityEngine;
using UnityEngine.Events;

[RequireComponent(typeof(Rigidbody))]
public class PlayerController : MonoBehaviour
{
    public enum PowerUpType
    {
        None,
        SpeedBoost,
        SuperKick,
        MagnetBall
    }

    [Header("Movement")]
    [SerializeField] private float moveSpeed = 5f;
    [SerializeField] private float sprintMultiplier = 1.6f;
    [SerializeField] private float acceleration = 18f;
    [SerializeField] private float turnSpeed = 540f;

    [Header("Kick")]
    [SerializeField] private Transform kickOrigin;
    [SerializeField] private LayerMask ballLayer;
    [SerializeField] private float kickRange = 2.2f;
    [SerializeField] private float minKickForce = 8f;
    [SerializeField] private float maxKickForce = 25f;
    [SerializeField] private float maxKickChargeTime = 1.25f;
    [SerializeField] private AnimationCurve kickChargeCurve = AnimationCurve.EaseInOut(0f, 0f, 1f, 1f);

    [Header("Power-Ups")]
    [SerializeField] private float magnetRadius = 8f;
    [SerializeField] private float magnetPullForce = 30f;

    [Header("UI Hooks")]
    [SerializeField] private UnityEvent<float> onKickChargeChanged;

    private readonly Collider[] _kickResults = new Collider[8];
    private Rigidbody _rb;
    private Camera _mainCamera;
    private Vector2 _moveInput;

    private bool _isChargingKick;
    private float _chargeStartTime;

    private PowerUpType _activePowerUp;
    private float _powerUpTimer;

    public float KickChargeNormalized
    {
        get
        {
            if (!_isChargingKick)
            {
                return 0f;
            }

            return Mathf.Clamp01((Time.time - _chargeStartTime) / maxKickChargeTime);
        }
    }

    private void Awake()
    {
        _rb = GetComponent<Rigidbody>();
        _rb.constraints = RigidbodyConstraints.FreezeRotationX | RigidbodyConstraints.FreezeRotationZ;
        _mainCamera = Camera.main;

        if (kickOrigin == null)
        {
            kickOrigin = transform;
        }
    }

    private void Update()
    {
        _moveInput.x = Input.GetAxisRaw("Horizontal");
        _moveInput.y = Input.GetAxisRaw("Vertical");

        HandleKickInput();
        UpdatePowerUpTimer();

        if (_isChargingKick)
        {
            onKickChargeChanged?.Invoke(KickChargeNormalized);
        }
    }

    private void FixedUpdate()
    {
        MovePlayer();

        if (_activePowerUp == PowerUpType.MagnetBall)
        {
            PullNearbyBall();
        }
    }

    public void ApplyPowerUp(PowerUpType powerUp, float durationSeconds)
    {
        _activePowerUp = powerUp;
        _powerUpTimer = Mathf.Max(0f, durationSeconds);
    }

    private void UpdatePowerUpTimer()
    {
        if (_activePowerUp == PowerUpType.None)
        {
            return;
        }

        _powerUpTimer -= Time.deltaTime;
        if (_powerUpTimer <= 0f)
        {
            _activePowerUp = PowerUpType.None;
            _powerUpTimer = 0f;
        }
    }

    private void MovePlayer()
    {
        Vector3 input = new Vector3(_moveInput.x, 0f, _moveInput.y).normalized;
        Vector3 worldInput = input;

        if (_mainCamera != null)
        {
            Vector3 forward = _mainCamera.transform.forward;
            Vector3 right = _mainCamera.transform.right;
            forward.y = 0f;
            right.y = 0f;
            forward.Normalize();
            right.Normalize();
            worldInput = (forward * input.z + right * input.x).normalized;
        }

        float speedMultiplier = Input.GetKey(KeyCode.LeftShift) || Input.GetKey(KeyCode.RightShift) ? sprintMultiplier : 1f;
        if (_activePowerUp == PowerUpType.SpeedBoost)
        {
            speedMultiplier *= 1.35f;
        }

        Vector3 targetHorizontalVelocity = worldInput * (moveSpeed * speedMultiplier);
        Vector3 currentHorizontalVelocity = new Vector3(_rb.velocity.x, 0f, _rb.velocity.z);
        Vector3 newHorizontalVelocity = Vector3.MoveTowards(currentHorizontalVelocity, targetHorizontalVelocity, acceleration * Time.fixedDeltaTime);
        _rb.velocity = new Vector3(newHorizontalVelocity.x, _rb.velocity.y, newHorizontalVelocity.z);

        if (worldInput.sqrMagnitude > 0.001f)
        {
            Quaternion targetRotation = Quaternion.LookRotation(worldInput, Vector3.up);
            _rb.MoveRotation(Quaternion.RotateTowards(_rb.rotation, targetRotation, turnSpeed * Time.fixedDeltaTime));
        }
    }

    private void HandleKickInput()
    {
        bool kickPressed = Input.GetMouseButtonDown(0) || Input.GetKeyDown(KeyCode.Space);
        bool kickReleased = Input.GetMouseButtonUp(0) || Input.GetKeyUp(KeyCode.Space);

        if (kickPressed)
        {
            _isChargingKick = true;
            _chargeStartTime = Time.time;
        }

        if (kickReleased && _isChargingKick)
        {
            float chargeNormalized = KickChargeNormalized;
            TryKick(chargeNormalized);
            _isChargingKick = false;
            onKickChargeChanged?.Invoke(0f);
        }
    }

    private void TryKick(float chargeNormalized)
    {
        int hitCount = Physics.OverlapSphereNonAlloc(kickOrigin.position, kickRange, _kickResults, ballLayer, QueryTriggerInteraction.Ignore);
        if (hitCount <= 0)
        {
            return;
        }

        Ball bestTarget = null;
        float bestDistance = float.MaxValue;

        for (int i = 0; i < hitCount; i++)
        {
            if (!_kickResults[i].TryGetComponent(out Ball ball))
            {
                continue;
            }

            float distance = (_kickResults[i].transform.position - transform.position).sqrMagnitude;
            if (distance < bestDistance)
            {
                bestDistance = distance;
                bestTarget = ball;
            }
        }

        if (bestTarget == null)
        {
            return;
        }

        float curveValue = kickChargeCurve.Evaluate(chargeNormalized);
        float force = Mathf.Lerp(minKickForce, maxKickForce, curveValue);
        if (_activePowerUp == PowerUpType.SuperKick)
        {
            force *= 1.7f;
        }

        Vector3 kickDirection = (transform.forward + Vector3.up * 0.25f).normalized;
        bestTarget.ApplyKick(kickDirection, force, this);
    }

    private void PullNearbyBall()
    {
        int hitCount = Physics.OverlapSphereNonAlloc(transform.position, magnetRadius, _kickResults, ballLayer, QueryTriggerInteraction.Ignore);
        for (int i = 0; i < hitCount; i++)
        {
            if (_kickResults[i].TryGetComponent(out Ball ball))
            {
                ball.ApplyMagnetForce(transform.position, magnetPullForce);
            }
        }
    }
}
