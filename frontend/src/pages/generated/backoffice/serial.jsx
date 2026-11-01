// Native React page. Data contract: backoffice/serial.
import { Fragment, cssStyle, text } from "@ui/runtime";
export default function Page({ data, state }) {
  return (
    <>
      {"\n"}
      <div className={"page-head"}>
        <div>
          <a className={"small"} href={"/app/inventory/serials/"}>
            {"‹ Serial explorer"}
          </a>
          <h1 className={"mono"} style={cssStyle("margin-top:.3rem")}>
            {data.v1}
          </h1>
          <div className={"sub"}>{data.v2}</div>
        </div>
        {"\n  "}
        <div className={"row"}>
          <a
            className={"btn btn-line btn-sm"}
            href={"/doc/label/" + text(data.v3) + "/"}
            target={"_blank"}
          >
            {"🖨️ Print Label"}
          </a>
          <span className={"badge " + text(data.v4)}>{data.v5}</span>
          <span className={"badge " + text(data.v6)}>{data.v7}</span>
        </div>
      </div>
      {"\n"}
      <div className={"grid g-main"}>
        {"\n  "}
        <div className={"card"}>
          <div className={"card-h"}>
            <h2>{"History"}</h2>
          </div>
          <div className={"card-b"}>
            <ul className={"tl"}>
              {data.rows8?.length ? (
                data.rows8.map((row8, index) => (
                  <Fragment key={index}>
                    <li>
                      <span className={"when"}>{row8.v9}</span>
                      <span className={"what"}>{row8.v10}</span>
                    </li>
                  </Fragment>
                ))
              ) : (
                <></>
              )}
            </ul>
          </div>
        </div>
        {"\n  "}
        <div className={"stack"}>
          {"\n    "}
          <div className={"card"}>
            <div className={"card-h"}>
              <h2>{"Customer"}</h2>
            </div>
            <div className={"card-b"}>
              {data.choice11 === 0 ? (
                <>
                  <b>{data.v12}</b>
                  <br />
                  <span className={"muted small"}>
                    {data.v13}
                    {" · "}
                    {data.v14}
                  </span>
                  {"\n      "}
                  <div className={"row mt-s"}>
                    <a
                      className={"btn btn-line btn-sm"}
                      href={"/app/p/" + text(data.v15) + "/"}
                    >
                      {"Project"}
                    </a>
                    <a
                      className={"btn btn-line btn-sm"}
                      href={"/app/help/customer/" + text(data.v16) + "/"}
                    >
                      {"Customer 360"}
                    </a>
                    {data.choice17 === 0 ? (
                      <>
                        <a
                          className={"btn btn-dark btn-sm"}
                          href={
                            "/app/help/ticket/new/?customer=" +
                            text(data.v18) +
                            "&serial=" +
                            text(data.v19)
                          }
                        >
                          {"Open ticket"}
                        </a>
                      </>
                    ) : null}
                  </div>
                </>
              ) : data.choice11 === 1 ? (
                <>
                  <span className={"muted"}>
                    {"Not assigned to a customer: still in the warehouse."}
                  </span>
                </>
              ) : null}
            </div>
          </div>
          {"\n    "}
          <div className={"card"}>
            <div className={"card-h"}>
              <h2>{"Warranty"}</h2>
            </div>
            <div className={"card-b"}>
              <dl
                className={"kv"}
                style={cssStyle("grid-template-columns:110px 1fr")}
              >
                <dt>{"Period"}</dt>
                <dd>
                  {data.v20}
                  {data.choice21 === 0 ? <>{" months"}</> : null}
                </dd>
                <dt>{"From"}</dt>
                <dd>{data.v22}</dd>
                <dt>{"Until"}</dt>
                <dd>{data.v23}</dd>
                <dt>{"Unit cost"}</dt>
                <dd>
                  {data.choice24 === 0 ? (
                    <>{data.v25}</>
                  ) : data.choice24 === 1 ? (
                    <>{"–"}</>
                  ) : null}
                </dd>
                {data.choice26 === 0 ? (
                  <>
                    <dt>{"Excluded"}</dt>
                    <dd>{data.v27}</dd>
                  </>
                ) : null}
              </dl>
            </div>
          </div>
          {"\n  "}
        </div>
        {"\n"}
      </div>
      {"\n"}
    </>
  );
}
