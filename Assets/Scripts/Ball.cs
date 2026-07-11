using UnityEngine;
using UnityEngine.Events;

[RequireComponent(typeof(Rigidbody))]
public class Ball : MonoBehaviour
{
    [SerializeField] private float maxBallSpeed = 22f;
    [SerializeField] private float groundDrag = 0.35f;
    [SerializeField] private UnityEvent onKicked;

    private Rigidbody _rb;

    public Component LastTouchedBy { get; private set; }

    private void Awake()
    {
        _rb = GetComponent<Rigidbody>();
        _rb.interpolation = RigidbodyInterpolation.Interpolate;
    }

    private void FixedUpdate()
    {
        Vector3 velocity = _rb.velocity;
        float speed = velocity.magnitude;
        if (speed > maxBallSpeed)
        {
            _rb.velocity = velocity.normalized * maxBallSpeed;
        }

        if (Mathf.Abs(_rb.velocity.y) < 0.3f)
        {
            _rb.velocity *= 1f - (groundDrag * Time.fixedDeltaTime);
        }
    }

    public void ApplyKick(Vector3 direction, float force, Component kicker)
    {
        LastTouchedBy = kicker;
        _rb.AddForce(direction.normalized * force, ForceMode.Impulse);
        onKicked?.Invoke();
    }

    public void ApplyMagnetForce(Vector3 sourcePosition, float pullStrength)
    {
        Vector3 toSource = sourcePosition - transform.position;
        float sqrDistance = Mathf.Max(toSource.sqrMagnitude, 0.1f);
        Vector3 force = toSource.normalized * (pullStrength / sqrDistance);
        _rb.AddForce(force, ForceMode.Acceleration);
    }

    public void ResetBall(Vector3 worldPosition)
    {
        transform.position = worldPosition;
        _rb.velocity = Vector3.zero;
        _rb.angularVelocity = Vector3.zero;
    }
}
