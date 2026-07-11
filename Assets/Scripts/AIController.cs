using UnityEngine;

[RequireComponent(typeof(Rigidbody))]
public class AIController : MonoBehaviour
{
    [Header("References")]
    [SerializeField] private Ball targetBall;
    [SerializeField] private Transform targetGoal;

    [Header("Movement")]
    [SerializeField] private float moveSpeed = 4.4f;
    [SerializeField] private float acceleration = 10f;
    [SerializeField] private float rotateSpeed = 360f;

    [Header("Kick")]
    [SerializeField] private float kickDistance = 2f;
    [SerializeField] private float kickForce = 15f;
    [SerializeField] private float kickCooldown = 0.8f;

    private Rigidbody _rb;
    private float _nextKickTime;

    private void Awake()
    {
        _rb = GetComponent<Rigidbody>();
        _rb.constraints = RigidbodyConstraints.FreezeRotationX | RigidbodyConstraints.FreezeRotationZ;

        if (targetBall == null)
        {
            targetBall = FindObjectOfType<Ball>();
        }
    }

    private void FixedUpdate()
    {
        if (targetBall == null)
        {
            return;
        }

        Vector3 chasePoint = targetBall.transform.position;
        chasePoint.y = transform.position.y;

        MoveTowards(chasePoint);
        TryKickBall();
    }

    private void MoveTowards(Vector3 worldPoint)
    {
        Vector3 toTarget = worldPoint - transform.position;
        toTarget.y = 0f;

        Vector3 desiredVelocity = toTarget.normalized * moveSpeed;
        Vector3 currentVelocity = new Vector3(_rb.velocity.x, 0f, _rb.velocity.z);
        Vector3 newVelocity = Vector3.MoveTowards(currentVelocity, desiredVelocity, acceleration * Time.fixedDeltaTime);

        _rb.velocity = new Vector3(newVelocity.x, _rb.velocity.y, newVelocity.z);

        if (toTarget.sqrMagnitude > 0.001f)
        {
            Quaternion targetRotation = Quaternion.LookRotation(toTarget.normalized);
            _rb.MoveRotation(Quaternion.RotateTowards(_rb.rotation, targetRotation, rotateSpeed * Time.fixedDeltaTime));
        }
    }

    private void TryKickBall()
    {
        if (Time.time < _nextKickTime)
        {
            return;
        }

        Vector3 toBall = targetBall.transform.position - transform.position;
        if (toBall.sqrMagnitude > kickDistance * kickDistance)
        {
            return;
        }

        Vector3 kickDirection;
        if (targetGoal != null)
        {
            kickDirection = (targetGoal.position - targetBall.transform.position).normalized;
        }
        else
        {
            kickDirection = transform.forward;
        }

        targetBall.ApplyKick((kickDirection + Vector3.up * 0.2f).normalized, kickForce, this);
        _nextKickTime = Time.time + kickCooldown;
    }
}
